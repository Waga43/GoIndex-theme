
# GoIndex-theme-acrou

## Demo  

Acrou: [https://oss.achirou.workers.dev/](https://oss.achirou.workers.dev/) 

## Log

### 2020-04-29

- Support multi-drive switching
- Add version detection
- Optimize search results
- Optimize page display

## TODO

- [x] Drive switch
- [ ] Pagination display
- [ ] Picture list display
- [ ] More file format preview

GoIndex  
====

Google Drive Directory Index  
Combining the power of [Cloudflare Workers](https://workers.cloudflare.com/) and [Google Drive](https://www.google.com/drive/) will allow you to index your files on the browser on Cloudflare Workers.    

`index.js` is the content of the Workers script.  

## Deployment  
1. Install `rclone` software locally  
2. Follow [https://rclone.org/drive/]( https://rclone.org/drive/) bind a drive  
3. Execute the command`rclone config file` to find the file `rclone.conf` path  
4. Open `rclone.conf`,find the configuration `root_folder_id` and `refresh_token`  
5. Download index.js in [here](https://github.com/ReAlpha39/goindex-theme-acrou/blob/alpha/index.js) and fill in `id`, `client_id`, `client_secret`, and `refresh_token`
6. Deploy the code to [Cloudflare Workers](https://www.cloudflare.com/)

## Quick Deployment  
1. Open [https://installen.gd.workers.dev/](https://installen.gd.workers.dev/)
2. Auth and get the code
3. Take note of `client_id`, `client_secret`, and `refresh_token`.
4. Download index.js in [here](https://github.com/ReAlpha39/goindex-theme-acrou/blob/alpha/index.js) and fill in `id` and note on step 3
5. Deploy the code to [Cloudflare Workers](https://www.cloudflare.com/)  


## How to Get Your Own client_id
1. Log into the [Google API Console](https://console.developers.google.com/) with your Google account. It doesn’t matter what Google account you use. (It need not be the same account as the Google Drive you want to access)

2. Select a project or create a new project.

3. Under “ENABLE APIS AND SERVICES” search for “Drive”, and enable the “Google Drive API”.

4. Click “Credentials” in the left-side panel (not “Create credentials”, which opens the wizard), then “Create credentials”, then “OAuth client ID”. It will prompt you to set the OAuth consent screen product name, if you haven’t set one already.

5. Choose an application type of “other”, and click “Create”. (the default name is fine)

6. It will show you a client ID and client secret. Use these values in rclone config to add a new remote or edit an existing remote.


## About  
Cloudflare Workers allow you to write JavaScript which runs on all of Cloudflare's 150+ global data centers.  