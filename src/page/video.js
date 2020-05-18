import Vue from "vue";

var govideo = Vue.component("govideo", {
  data: function () {
    return {
      apiurl: "",
      videourl: "",
      title: "",
    };
  },
  methods: {
    render(path) {
      this.title = path.split("/").pop();
      this.videourl = window.location.origin + path;
      this.apiurl =
        "https://api.jsonpop.cn/demo/blplyaer/?url=" + this.videourl;
    },
  },
  computed: {
    players() {
      return [{
          name: 'IINA',
          icon: 'https://www.iina.io/images/iina-icon-60.png',
          scheme: 'iina://weblink?url=' + this.videourl
        },
        {
          name: 'PotPlayer',
          icon: 'https://cloud.jsonpop.cn/go2index/player/potplayer.png',
          scheme: 'potplayer://' + this.videourl
        },
        {
          name: 'VLC',
          icon: 'https://cloud.jsonpop.cn/go2index/player/vlc.png',
          scheme: 'vlc://' + this.videourl
        },
        {
          name: 'MXPlayer',
          icon: 'https://cloud.jsonpop.cn/go2index/player/mxplayer.png',
          scheme: 'intent:'
        },
        {
          name: 'nPlayer',
          icon: 'https://cloud.jsonpop.cn/go2index/player/nplayer.png',
          scheme: 'nplayer-'
        }
      ]
    },
  },
  template: `
    <div class="content">
        <div class="video-content">
          <iframe width="100%" height="100%" :src="apiurl" frameborder="0" border="0" marginwidth="0" marginheight="0" scrolling="no" allowtransparency="true" allowfullscreen="true"></iframe>
        </div>
        <div class="card">
            <header class="card-header">
                <p class="card-header-title">
                     <span class="icon"><i class="fa fa-download" aria-hidden="true"></i></span>
                     Download
                </p>
            </header>
            <div class="card-content">
                <div class="content">
                  <div class="field">
                    <label class="label">Download Link :</label>
                    <div class="control">
                      <input class="input" type="text" :value="decodeURIComponent(videourl)">
                    </div>
                  </div>
                  <div class="columns is-mobile is-multiline has-text-centered">
                    <div class="column" v-for="item in players">
                      <p class="heading">
                          <figure class="image is-48x48" style="margin: 0 auto;">
                            <img class="icon" :src="item.icon" />
                          </figure>
                        </a>
                      </p>
                      <p class="">{{item.name}}</p>
                    </div>
                  </div>
                </div>
            </div>  
        </div>
    </div>
  `,
});

export default govideo;
