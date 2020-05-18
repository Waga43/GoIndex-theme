import Vue from "vue";
import axios from "@/utils/axios";
import SearchModel from "./components/SearchModel";
import { checkoutPath, utc2beijing, formatFileSize } from "@/utils/AcrouUtil";

var list = Vue.component("list", {
  data: function () {
    return {
      page: {
        page_token: null,
        page_index: 0
      },
      files: [],
      loading: false,
      columns: [
        { name: "Name", style: "" },
        {
          name: "Last Modified",
          style: "width:20%",
          class: "is-hidden-mobile is-hidden-touch",
        },
        {
          name: "Size",
          style: "width:12%",
          class: "is-hidden-mobile is-hidden-touch",
        },
        {
          name: "Actions",
          style: "width:10%",
          class: "is-hidden-mobile is-hidden-touch",
        },
      ],
      icon: {
        "application/vnd.google-apps.folder": "icon-morenwenjianjia",
        "video/mp4": "icon-mp",
        "video/x-matroska": "icon-mkv",
        "video/x-msvideo": "icon-avi",
        "video/webm": "icon-webm",
        "text/plain": "icon-txt",
        "text/markdown": "icon-markdown",
        "text/x-ssa": "icon-ASS",
        "text/html": "icon-html",
        "text/x-python-script": "icon-python",
        "text/x-java": "icon-java1",
        "text/x-sh": "icon-SH",
        "application/x-subrip": "icon-srt",
        "application/zip": "icon-zip",
        "application/rar": "icon-rar",
        "application/pdf": "icon-pdf",
        "application/json": "icon-JSON1",
        "application/x-yaml": "icon-YML",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "icon-word",
        "image/bmp": "icon-img",
        "image/jpeg": "icon-img",
        "image/png": "icon-img"
      },
    };
  },
  methods: {
    render (path, param) {
      this.loading = true;
      var password = localStorage.getItem("password" + path);
      var p = {
        q: decodeURIComponent(param),
        password: password || null,
        ...this.page
      };
      axios
        .post(path, p)
        .then((res) => {
          let body = res.data;
          if (body) {
            // Determine response status
            if (body.error && body.error.code == "401") {
              this.checkPassword(path);
              return;
            }
            let data = body.data;
            if (!data) return;
            this.page = {
              page_token: body.nextPageToken,
              page_index: body.curPageIndex
            };
            try {
              this.files = data.files.map(item => {
                var p = path.replace('search', 'search/') + checkoutPath(item.name,item);
                if(!path.match("/[0-9]+:search")){
                  // HEAD.md
                  if (item.name === "HEAD.md") {
                    this.$emit("headmd", {
                      display: true,
                      file: item,
                      path: path + item.name
                    });
                  }
                  // REDEME.md
                  if (item.name === "README.md") {
                    this.$emit("readmemd", {
                      display: true,
                      file: item,
                      path: path + item.name
                    });
                  }
                }
                return {
                  path: p,
                  ...item,
                  modifiedTime: utc2beijing(item.modifiedTime),
                  size: formatFileSize(item.size)
                };
              });
            } catch (e) {
              console.log(e);
            }
          }
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
        });
    },
    checkPassword (path) {
      var pass = prompt("Directory encryption, please enter the password ", "");
      localStorage.setItem("password" + path, pass);
      if (pass != null && pass != "") {
        this.render(path);
      } else {
        history.go(-1);
      }
    },
    go (file, target = "view") {
      let path = file.path
      if(path.match("/[0-9]+:search/")){
        this.$refs.goSearchResult.go(file, target)
        return
      }
      if (target === "down") {
        path = path.replace("?a=view", "");
      }
      if(target === '_blank'){
        window.open(path)
      }else{
        location.href = path;
      }
    },
    getIcon (type) {
      return "#" + (this.icon[type] ? this.icon[type] : "icon-weizhi");
    },
  },
  components: {
    SearchModel
  },
  template: `
    <div>
      <progress v-if="loading" class="progress is-small is-primary" style="height: .25rem;" max="100">15%</progress>
      <table class="table is-hoverable">
          <thead>
          <tr>
              <th v-for="column in columns" :class="column.class" :style="column.style">{{column.name}}</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="file in files">
              <td @click="go(file)">
                <svg class="iconfont" aria-hidden="true">
                    <use :xlink:href="getIcon(file.mimeType)"></use>
                </svg>
                {{file.name}}
              </td>
              <td class="is-hidden-mobile is-hidden-touch">{{file.modifiedTime}}</td>
              <td class="is-hidden-mobile is-hidden-touch">{{file.size}}</td>
              <td class="is-hidden-mobile is-hidden-touch" v-if="file.mimeType!=='application/vnd.google-apps.folder'">
                <span class="icon" @click.stop="go(file,'_blank')">
                  <i class="fa fa-external-link faa-shake animated-hover" title="Open a new tab" aria-hidden="true"></i> 
                </span>
                <span class="icon" @click.stop="go(file,'down')">
                  <i class="fa fa-download faa-shake animated-hover" title="Download"></i>
                </span>
              </td>
          </tr>
          </tbody>
      </table>
      <div v-show="files.length==0" class="has-text-centered no-content">
      </div>
      <search-model ref="goSearchResult"></search-model>
    </div>
    `,
});

export default list;
