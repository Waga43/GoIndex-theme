self.props = {
    siteName: 'GoIndex', // site name
    version: '1.14', // version
    theme: 'acrou',
    // Highly recommend using your own client_id and client_secret
    client_id: '202264815644.apps.googleusercontent.com',
	client_secret: 'X4Z3ca8xfWDb1Voo-F9a7ZxJ',
    refresh_token: '',
    /**
     * Set up multiple Drives to display; add multiples by format
     *   id: can be team drive id, subfolder id, or "root" (representing the root directory of personal drive);
     *   name: Display name
     *   pass: It can be set separately for the corresponding password, or an empty string if no password is required;
     * [Note] For the drive whose id is set to the subfolder id,
     * the search function will not be supported (it does not affect other drive).
     */
    roots: [
        {
            default_id: 'root',
            name: 'MyDrive',
            pass: '',
        },
        {
            default_id: 'drive_id',
            name: 'TeamDrive',
            pass: '',
        },
        {
            default_id: 'folder_id',
            name: 'folder1',
            pass: '',
        }
    ],
    default_gd: 0,
    /**
     *   The number displayed on each page of the file list page. 
     *   [Recommended setting value is between 100 and 1000];
     * If the setting is greater than 1000, 
     * it will cause an error when requesting drive api;
     *   If the set value is too small, it will cause the incremental loading 
     *   (page loading) of the scroll bar of the file list page to fail;
     * Another effect of this value, if the number of files in the directory is greater than this setting value 
     * (that is, multiple pages need to be displayed), the results of the first listing directory will be cached.
     */
    files_list_page_size: 20,
    /**
     *   The number displayed on each page of the search results page. 
     *   [Recommended setting value is between 50 and 1000];
     * If the setting is greater than 1000, 
     * it will cause an error when requesting drive api;
     *   If the set value is too small, it will cause the incremental loading 
     *   (page loading) of the scroll bar of the search results page to fail;
     * The size of this value affects the response speed of the search operation.
     */
    search_result_list_page_size: 50
};

/**
 * global functions
 */
const FUNCS = {
    /**
     * Transform into relatively safe search keywords for Google search morphology
     */
    formatSearchKeyword: function (keyword) {
        let nothing = "";
        let space = " ";
        if (!keyword) return nothing;
        return keyword.replace(/(!=)|['"=<>/\\:]/g, nothing)
            .replace(/[,，|(){}]/g, space)
            .trim()
    }

};

/**
 * global consts
 * @type {{folder_mime_type: string, default_file_fields: string, gd_root_type: {share_drive: number, user_drive: number, sub_folder: number}}}
 */
const CONSTS = new (class {
    default_file_fields = 'parents,id,name,mimeType,modifiedTime,createdTime,fileExtension,size';
    gd_root_type = {
        user_drive: 0,
        share_drive: 1,
        sub_folder: 2
    };
    folder_mime_type = 'application/vnd.google-apps.folder';
})();


// gd instances
var gds = [];

function html(current_drive_order = 0, model = {}) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0,maximum-scale=1.0, user-scalable=no"/>
  <title>${self.props.siteName}</title>

  <script>
    window.gdconfig = JSON.parse('${JSON.stringify({version: self.props.version})}');
    window.gds = JSON.parse('${JSON.stringify(self.props.roots.map(it => it.name))}');
    window.MODEL = JSON.parse('${JSON.stringify(model)}');
    window.current_drive_order = ${current_drive_order};
  </script>
  <script src="https://cdn.jsdelivr.net/gh/ReAlpha39/goindex-theme-acrou@${self.props.version}/dist/app.mini.js"></script>
</head>
<body>
</body>
</html>
`;
};

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

/**
 * Fetch and log a request
 * @param {Request} request
 */
async function handleRequest(request) {
    if (gds.length === 0) {
        for (let i = 0; i < self.props.roots.length; i++) {
            const gd = new googleDrive(authConfig, i);
            await gd.init();
            gds.push(gd)
        }
        // This operation is parallel to improve efficiency
        let tasks = [];
        gds.forEach(gd => {
            tasks.push(gd.initRootType());
        });
        for (let task of tasks) {
            await task;
        }
    }

    // Extract drive order from path
    // And get the corresponding gd instance according to the drive order
    let gd;
    let url = new URL(request.url);
    let path = url.pathname;

    /**
     * Redirect to start page
     * @returns {Response}
     */
    function redirectToIndexPage() {
        return new Response('', {status: 301, headers: {'Location': `/${self.props.default_gd}:/`}});
    }

    if (path == '/') return redirectToIndexPage();
    if (path.toLowerCase() == '/favicon.ico') {
        // You can find a favicon later
        return new Response('', {status: 404})
    }

    // Special command format
    const command_reg = /^\/(?<num>\d+):(?<command>[a-zA-Z0-9]+)$/g;
    const match = command_reg.exec(path);
    if (match) {
        const num = match.groups.num;
        const order = Number(num);
        if (order >= 0 && order < gds.length) {
            gd = gds[order];
        } else {
            return redirectToIndexPage()
        }
        const command = match.groups.command;
        // search for
        if (command === 'search') {
            if (request.method === 'POST') {
                // search results
                return handleSearch(request, gd);
            } else {
                const params = url.searchParams;
                // Search page
                return new Response(html(gd.order, {
                        q: params.get("q") || '',
                        is_search_page: true,
                        root_type: gd.root_type
                    }),
                    {
                        status: 200,
                        headers: {'Content-Type': 'text/html; charset=utf-8'}
                    });
            }
        } else if (command === 'id2path' && request.method === 'POST') {
            return handleId2Path(request, gd)
        }
    }

    // Desired path format
    const common_reg = /^\/\d+:\/.*$/g;
    try {
        if (!path.match(common_reg)) {
            return redirectToIndexPage();
        }
        let split = path.split("/");
        let order = Number(split[1].slice(0, -1));
        if (order >= 0 && order < gds.length) {
            gd = gds[order];
        } else {
            return redirectToIndexPage()
        }
    } catch (e) {
        return redirectToIndexPage()
    }

    path = path.replace(gd.url_path_prefix, '') || '/';
    if (request.method == 'POST') {
        return apiRequest(request, gd);
    }

    let action = url.searchParams.get('a');

    if (path.substr(-1) == '/' || action != null) {
        return new Response(html(gd.order, {root_type: gd.root_type}), {
            status: 200,
            headers: {'Content-Type': 'text/html; charset=utf-8'}
        });
    } else {
        if (path.split('/').pop().toLowerCase() == ".password") {
            return new Response("", {status: 404});
        }
        let file = await gd.file(path);
        let range = request.headers.get('Range');
        return gd.down(file.id, range);
    }
}


async function apiRequest(request, gd) {
    let url = new URL(request.url);
    let path = url.pathname;
    path = path.replace(gd.url_path_prefix, '') || '/';

    let option = {status: 200, headers: {'Access-Control-Allow-Origin': '*'}}

    if (path.substr(-1) == '/') {
        let deferred_pass = gd.password(path);
        let body = await request.text();
        body = JSON.parse(body);
        // This can increase the speed of the first listing. 
        // The disadvantage is that if the password verification fails, 
        // the overhead of listing directories will still be incurred
        let deferred_list_result = gd.list(path, body.page_token, Number(body.page_index));

        // check password
        let password = await deferred_pass;
        // console.log("dir password", password);
        if (password != undefined && password != null && password != "") {
            if (password.replace("\n", "") != body.password) {
                let html = `{"error": {"code": 401,"message": "password error."}}`;
                return new Response(html, option);
            }
        }

        let list_result = await deferred_list_result;
        return new Response(JSON.stringify(list_result), option);
    } else {
        let file = await gd.file(path);
        let range = request.headers.get('Range');
        return new Response(JSON.stringify(file));
    }
}

// Processing search
async function handleSearch(request, gd) {
    const option = {status: 200, headers: {'Access-Control-Allow-Origin': '*'}};
    let body = await request.text();
        body = JSON.parse(body);
    let search_result = await
        gd.search(body.q || '', body.page_token, Number(body.page_index));
    return new Response(JSON.stringify(search_result), option);
}

/**
 * Handle id2path
 * @param request Id parameter required
 * @param gd
 * [Note] If the item represented by the id received from the root is not under the target gd drive,
 *  then the response will be returned to the root with an empty string ""
 * @returns {Promise<Response>} 
 */
async function handleId2Path(request, gd) {
    const option = {status: 200, headers: {'Access-Control-Allow-Origin': '*'}};
    let body = await request.text();
        body = JSON.parse(body);
    let path = await gd.findPathById(body.id);
    return new Response(path || '', option);
}

class googleDrive {
    constructor(authConfig, order) {
        // Each drive corresponds to an order, corresponding to a gd instance
        this.order = order;
        this.root = self.props.roots[order];
        this.url_path_prefix = `/${order}:`;
        this.authConfig = authConfig;
        // TODO: The invalid refresh strategy of these caches can be formulated later
        // path id
        this.paths = [];
        // path file
        this.files = [];
        // path pass
        this.passwords = [];
        // id <-> path
        this.id_path_cache = {};
        this.id_path_cache[this.root['default_id']] = '/';
        this.paths["/"] = this.root['default_id'];
        if (this.root['pass'] != "") {
            this.passwords['/'] = this.root['pass'];
        }
        // this.init();
    }

    /**
     * Initial authorization; get user_drive_real_root_id
     * @returns {Promise<void>}
     */
    async init() {
        await this.accessToken();
        /*await (async () => {
            // Get only 1 time
            if (self.props.user_drive_real_root_id) return;
            const root_obj = await (gds[0] || this).findItemById('root');
            if (root_obj && root_obj.id) {
                self.props.user_drive_real_root_id = root_obj.id
            }
        })();*/
        // Wait for user_drive_real_root_id and only get it once
        if (self.props.user_drive_real_root_id) return;
        const root_obj = await (gds[0] || this).findItemById('root');
        if (root_obj && root_obj.id) {
            self.props.user_drive_real_root_id = root_obj.id
        }
    }

    /**
     * Get the root directory type, set to root_type
     * @returns {Promise<void>}
     */
    async initRootType() {
        const root_id = this.root['default_id'];
        const types = CONSTS.gd_root_type;
        if (root_id === 'root' || root_id === self.props.user_drive_real_root_id) {
            this.root_type = types.user_drive;
        } else {
            const obj = await this.getShareDriveObjById(root_id);
            this.root_type = obj ? types.share_drive : types.sub_folder;
        }
    }

    async down(id, range = '') {
        let url = `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;
        let requestOption = await this.requestOption();
        requestOption.headers['Range'] = range;
        return await fetch(url, requestOption);
    }

    async file(path) {
        if (typeof this.files[path] == 'undefined') {
            this.files[path] = await this._file(path);
        }
        return this.files[path];
    }

    async _file(path) {
        let arr = path.split('/');
        let name = arr.pop();
        name = decodeURIComponent(name).replace(/\'/g, "\\'");
        let dir = arr.join('/') + '/';
        // console.log(name, dir);
        let parent = await this.findPathId(dir);
        // console.log(parent);
        let url = 'https://www.googleapis.com/drive/v3/files';
        let params = {'includeItemsFromAllDrives': true, 'supportsAllDrives': true};
        params.q = `'${parent}' in parents and name = '${name}' and trashed = false`;
        params.fields = "files(id, name, mimeType, size ,createdTime, modifiedTime, iconLink, thumbnailLink)";
        url += '?' + this.enQuery(params);
        let requestOption = await this.requestOption();
        let response = await fetch(url, requestOption);
        let obj = await response.json();
        // console.log(obj);
        return obj.files[0];
    }

    // Cache through request cache
    async list(path, page_token = null, page_index = 0) {
        if (this.path_children_cache == undefined) {
            // { <path> :[ {nextPageToken:'',data:{}}, {nextPageToken:'',data:{}} ...], ...}
            this.path_children_cache = {};
        }

        if (this.path_children_cache[path]
            && this.path_children_cache[path][page_index]
            && this.path_children_cache[path][page_index].data
        ) {
            let child_obj = this.path_children_cache[path][page_index];
            return {
                nextPageToken: child_obj.nextPageToken || null,
                curPageIndex: page_index,
                data: child_obj.data
            };
        }

        let id = await this.findPathId(path);
        let result = await this._ls(id, page_token, page_index);
        let data = result.data;
        // Cache multiple pages
        if (result.nextPageToken && data.files) {
            if (!Array.isArray(this.path_children_cache[path])) {
                this.path_children_cache[path] = []
            }
            this.path_children_cache[path][Number(result.curPageIndex)] = {
                nextPageToken: result.nextPageToken,
                data: data
            };
        }

        return result
    }


    async _ls(parent, page_token = null, page_index = 0) {
        // console.log("_ls", parent);

        if (parent == undefined) {
            return null;
        }
        let obj;
        let params = {'includeItemsFromAllDrives': true, 'supportsAllDrives': true};
        params.q = `'${parent}' in parents and trashed = false AND name !='.password'`;
        params.orderBy = 'folder,name,modifiedTime desc';
        params.fields = "nextPageToken, files(id, name, mimeType, size , modifiedTime)";
        params.pageSize = this.self.props.files_list_page_size;

        if (page_token) {
            params.pageToken = page_token;
        }
        let url = 'https://www.googleapis.com/drive/v3/files';
        url += '?' + this.enQuery(params);
        let requestOption = await this.requestOption();
        let response = await fetch(url, requestOption);
        obj = await response.json();

        return {
            nextPageToken: obj.nextPageToken || null,
            curPageIndex: page_index,
            data: obj
        };

        /*do {
            if (pageToken) {
                params.pageToken = pageToken;
            }
            let url = 'https://www.googleapis.com/drive/v3/files';
            url += '?' + this.enQuery(params);
            let requestOption = await this.requestOption();
            let response = await fetch(url, requestOption);
            obj = await response.json();
            files.push(...obj.files);
            pageToken = obj.nextPageToken;
        } while (pageToken);*/

    }

    async password(path) {
        if (this.passwords[path] !== undefined) {
            return this.passwords[path];
        }

        // console.log("load", path, ".password", this.passwords[path]);

        let file = await this.file(path + '.password');
        if (file == undefined) {
            this.passwords[path] = null;
        } else {
            let url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
            let requestOption = await this.requestOption();
            let response = await this.fetch200(url, requestOption);
            this.passwords[path] = await response.text();
        }

        return this.passwords[path];
    }


    /**
     * Get shared drive information by id
     * @param any_id
     * @returns {Promise<null|{id}|any>} Any abnormal situation returns null
     */
    async getShareDriveObjById(any_id) {
        if (!any_id) return null;
        if ('string' !== typeof any_id) return null;

        let url = `https://www.googleapis.com/drive/v3/drives/${any_id}`;
        let requestOption = await this.requestOption();
        let res = await fetch(url, requestOption);
        let obj = await res.json();
        if (obj && obj.id) return obj;

        return null
    }


    /**
     * search for
     * @returns {Promise<{data: null, nextPageToken: null, curPageIndex: number}>}
     */
    async search(origin_keyword, page_token = null, page_index = 0) {
        const types = CONSTS.gd_root_type;
        const is_user_drive = this.root_type === types.user_drive;
        const is_share_drive = this.root_type === types.share_drive;

        const empty_result = {
            nextPageToken: null,
            curPageIndex: page_index,
            data: null
        };

        if (!is_user_drive && !is_share_drive) {
            return empty_result;
        }
        let keyword = FUNCS.formatSearchKeyword(origin_keyword);
        if (!keyword) {
            // The keyword is empty? return
            return empty_result;
        }
        let words = keyword.split(/\s+/);
        let name_search_str = `name contains '${words.join("' AND name contains '")}'`;

        // corpora is a personal drive for user, and drive  for team drive. With driveId
        let params = {};
        if (is_user_drive) {
            params.corpora = 'user'
        }
        if (is_share_drive) {
            params.corpora = 'drive';
            params.driveId = this.root.id;
            // This parameter will only be effective until June 1, 2020. Afterwards shared drive items will be included in the results.
            params.includeItemsFromAllDrives = true;
            params.supportsAllDrives = true;
        }
        if (page_token) {
            params.pageToken = page_token;
        }
        params.q = `trashed = false AND name !='.password' AND (${name_search_str})`;
        params.fields = "nextPageToken, files(id, name, mimeType, size , modifiedTime)";
        params.pageSize = this.self.props.search_result_list_page_size;
        // params.orderBy = 'folder,name,modifiedTime desc';

        let url = 'https://www.googleapis.com/drive/v3/files';
        url += '?' + this.enQuery(params);
        // console.log(params)
        let requestOption = await this.requestOption();
        let response = await fetch(url, requestOption);
        let res_obj = await response.json();

        return {
            nextPageToken: res_obj.nextPageToken || null,
            curPageIndex: page_index,
            data: res_obj
        };
    }


    /**
     *   Get the file object of the upper folder of this file or folder layer by layer. 
     *   Note: It will be very slow! ! !
     * Up to find the root directory (root id) of the current gd object
     * Only consider a single upward chain.
     *   [Note] If the item represented by this id is not in the target gd disk, 
     *   then this function will return null
     *
     * @param child_id
     * @param contain_myself
     * @returns {Promise<[]>}
     */
    async findParentFilesRecursion(child_id, contain_myself = true) {
        const gd = this;
        const gd_root_id = gd.root.id;
        const user_drive_real_root_id = self.props.user_drive_real_root_id;
        const is_user_drive = gd.root_type === CONSTS.gd_root_type.user_drive;

        // End point query id from bottom to top
        const target_top_id = is_user_drive ? user_drive_real_root_id : gd_root_id;
        const fields = CONSTS.default_file_fields;

        // [{},{},...]
        const parent_files = [];
        let meet_top = false;

        async function addItsFirstParent(file_obj) {
            if (!file_obj) return;
            if (!file_obj.parents) return;
            if (file_obj.parents.length < 1) return;

            // ['','',...]
            let p_ids = file_obj.parents;
            if (p_ids && p_ids.length > 0) {
                // its first parent
                const first_p_id = p_ids[0];
                if (first_p_id === target_top_id) {
                    meet_top = true;
                    return;
                }
                const p_file_obj = await gd.findItemById(first_p_id);
                if (p_file_obj && p_file_obj.id) {
                    parent_files.push(p_file_obj);
                    await addItsFirstParent(p_file_obj);
                }
            }
        }

        const child_obj = await gd.findItemById(child_id);
        if (contain_myself) {
            parent_files.push(child_obj);
        }
        await addItsFirstParent(child_obj);

        return meet_top ? parent_files : null
    }

    /**
     * Get the path relative to the root directory of this disk
     * @param child_id
     * [Note] If the item represented by this id is not in the target gd disk, 
     * then this method will return an empty string ""
     * @returns {Promise<string>}
     */
    async findPathById(child_id) {
        if (this.id_path_cache[child_id]) {
            return this.id_path_cache[child_id];
        }

        const p_files = await this.findParentFilesRecursion(child_id);
        if (!p_files || p_files.length < 1) return '';

        let cache = [];
        // Cache the path and id of each level found
        p_files.forEach((value, idx) => {
            const is_folder = idx === 0 ? (p_files[idx].mimeType === CONSTS.folder_mime_type) : true;
            let path = '/' + p_files.slice(idx).map(it => it.name).reverse().join('/');
            if (is_folder) path += '/';
            cache.push({id: p_files[idx].id, path: path})
        });

        cache.forEach((obj) => {
            this.id_path_cache[obj.id] = obj.path;
            this.paths[obj.path] = obj.id
        });

        /*const is_folder = p_files[0].mimeType === CONSTS.folder_mime_type;
        let path = '/' + p_files.map(it => it.name).reverse().join('/');
        if (is_folder) path += '/';*/

        return cache[0].path;
    }


    // Get file item based on id
    async findItemById(id) {
        const is_user_drive = this.root_type === CONSTS.gd_root_type.user_drive;
        let url = `https://www.googleapis.com/drive/v3/files/${id}?fields=${CONSTS.default_file_fields}${is_user_drive ? '' : '&supportsAllDrives=true'}`;
        let requestOption = await this.requestOption();
        let res = await fetch(url, requestOption);
        return await res.json()
    }

    async findPathId(path) {
        let c_path = '/';
        let c_id = this.paths[c_path];

        let arr = path.trim('/').split('/');
        for (let name of arr) {
            c_path += name + '/';

            if (typeof this.paths[c_path] == 'undefined') {
                let id = await this._findDirId(c_id, name);
                this.paths[c_path] = id;
            }

            c_id = this.paths[c_path];
            if (c_id == undefined || c_id == null) {
                break;
            }
        }
        // console.log(this.paths);
        return this.paths[path];
    }

    async _findDirId(parent, name) {
        name = decodeURIComponent(name).replace(/\'/g, "\\'");

        // console.log("_findDirId", parent, name);

        if (parent == undefined) {
            return null;
        }

        let url = 'https://www.googleapis.com/drive/v3/files';
        let params = {'includeItemsFromAllDrives': true, 'supportsAllDrives': true};
        params.q = `'${parent}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${name}'  and trashed = false`;
        params.fields = "nextPageToken, files(id, name, mimeType)";
        url += '?' + this.enQuery(params);
        let requestOption = await this.requestOption();
        let response = await fetch(url, requestOption);
        let obj = await response.json();
        if (obj.files[0] == undefined) {
            return null;
        }
        return obj.files[0].id;
    }

    async accessToken() {
        console.log("accessToken");
        if (this.self.props.expires == undefined || this.self.props.expires < Date.now()) {
            const obj = await this.fetchAccessToken();
            if (obj.access_token != undefined) {
                this.self.props.accessToken = obj.access_token;
                this.self.props.expires = Date.now() + 3500 * 1000;
            }
        }
        return this.self.props.accessToken;
    }

    async fetchAccessToken() {
        console.log("fetchAccessToken");
        const url = "https://www.googleapis.com/oauth2/v4/token";
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        const post_data = {
            'client_id': this.self.props.client_id,
            'client_secret': this.self.props.client_secret,
            'refresh_token': this.self.props.refresh_token,
            'grant_type': 'refresh_token'
        }

        let requestOption = {
            'method': 'POST',
            'headers': headers,
            'body': this.enQuery(post_data)
        };

        const response = await fetch(url, requestOption);
        return await response.json();
    }

    async fetch200(url, requestOption) {
        let response;
        for (let i = 0; i < 3; i++) {
            response = await fetch(url, requestOption);
            console.log(response.status);
            if (response.status != 403) {
                break;
            }
            await this.sleep(800 * (i + 1));
        }
        return response;
    }

    async requestOption(headers = {}, method = 'GET') {
        const accessToken = await this.accessToken();
        headers['authorization'] = 'Bearer ' + accessToken;
        return {'method': method, 'headers': headers};
    }

    enQuery(data) {
        const ret = [];
        for (let d in data) {
            ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
        }
        return ret.join('&');
    }

    sleep(ms) {
        return new Promise(function (resolve, reject) {
            let i = 0;
            setTimeout(function () {
                console.log('sleep' + ms);
                i++;
                if (i >= 2) reject(new Error('i>=2'));
                else resolve(i);
            }, ms);
        })
    }
}

String.prototype.trim = function (char) {
    if (char) {
        return this.replace(new RegExp('^\\' + char + '+|\\' + char + '+$', 'g'), '');
    }
    return this.replace(/^\s+|\s+$/g, '');
};
