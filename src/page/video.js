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
        "https://onelineplayer.com/player.html?autoplay=true&autopause=false&muted=true&loop=false&poster=&time=true&progressBar=true&overlay=true&muteButton=true&fullscreenButton=true&style=light&quality=auto&playButton=true&url=" + this.videourl;
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
          name: 'nPlayer',
          icon: 'https://cloud.jsonpop.cn/go2index/player/nplayer.png',
          scheme: 'nplayer-' + this.videourl
        },
        {
          name: 'MXPlayer(Free)',
          icon: 'https://cloud.jsonpop.cn/go2index/player/mxplayer.png',
          scheme: 'intent:' + this.videourl + '#Intent;package=com.mxtech.videoplayer.ad;S.title=' + this.title + ';end'
        },
        {
          name: 'MXPlayer(Pro)',
          icon: 'https://cloud.jsonpop.cn/go2index/player/mxplayer.png',
          scheme: 'intent:' + this.videourl + '#Intent;package=com.mxtech.videoplayer.pro;S.title=' + this.title + ';end'
        }
      ]
    },
  },
  template: `
    <div class="content">
        <div class="video-content">
        <div style="padding-top: 50%; position: relative; overflow: hidden;"><iframe frameborder="0" allowfullscreen="" scrolling="no" allow="autoplay;fullscreen" :src="apiurl" style="position: absolute; height: 100%; width: 100%; left: 0px; top: 0px;"></iframe></div>
        </div>
        <div class="card">
            <header class="card-header">
                <p class="card-header-title">
                    <a :href="videourl">
		    <span class="icon"><i class="fa fa-download" aria-hidden="true"></i></span>
                    Download
		    </a>
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
                        <a :href="item.scheme">
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
