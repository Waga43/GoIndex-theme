import Vue from "vue";

let navbar = Vue.component("navbar", {
  created() {
    if (window.gds && window.gds.length > 0) {
      this.gds = window.gds.map((item, index) => {
        return {
          name: item,
          id: "/" + index + ":/"
        };
      });
      
      // Current drive
      this.currgd = localStorage.getItem("currgd") ?
          JSON.parse(localStorage.getItem("currgd")) :
          this.gds[0];

      let path = window.location.pathname;
      let id = path.match("/[0-9]+:")
      if (id) {
        id = id[0] + '/'
        let currgd = this.gds.filter(item => {
          return item.id === id
        })
        if(currgd){
          this.currgd = currgd[0]
          localStorage.setItem("currgd", JSON.stringify(currgd[0]));
        }
      }

      // Echo search parameters
      if (window.MODEL) {
        this.param = window.MODEL.q ? window.MODEL.q : "";
      }
    }
  },
  data: function () {
    return {
      siteName: "",
      param: "",
      currgd: {},
      gds: [],
      isActive: false
    };
  },
  methods: {
    changeItem(item) {
      this.currgd = item;
      localStorage.setItem("currgd", JSON.stringify(item));
      location.href = item.id;
    },
    query() {
      if (this.param) {
        location.href =
          this.currgd.id.match("/[0-9]+:") + "search?q=" + this.param;
      }
    },
    burgerClick() {
      this.isActive = !this.isActive
    }
  },
  computed: {
    getCurrGD() {
      return this.gds.filter((item) => item.name !== this.currgd.name);
    },
  },
  template: `
              <nav class="navbar is-dark" role="navigation" aria-label="main navigation">
                  <div class="container">
                      <div class="navbar-brand">
                          <a class="navbar-item" :href="currgd.id">
                              <h3 class="title is-3 has-text-white">{{siteName}}</h3>
                          </a>
                          <a role="button" :class="'navbar-burger burger '+(isActive?'is-active':'')" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample"
                          @click="burgerClick">
                              <span aria-hidden="true"></span>
                              <span aria-hidden="true"></span>
                              <span aria-hidden="true"></span>
                          </a>
                      </div>
                      <div id="navbarBasicExample" :class="'navbar-menu '+(isActive?'is-active':'')">
                          <div class="navbar-start">
                            <div class="navbar-item has-dropdown is-hoverable" v-if="gds.length>0 && getCurrGD.length>0">
                                <a class="navbar-link">
                                    {{this.currgd.name}}
                                </a>
                                <div class="navbar-dropdown is-boxed">
                                    <a class="navbar-item" @click="changeItem(item)" v-for="item in getCurrGD">
                                        {{item.name}}
                                    </a>
                                </div>
                            </div>
                          </div>
  
                          <div class="navbar-end">
                              <div class="navbar-item">
                                  <div class="field is-grouped">
                                      <p class="control has-icons-left" style="width:100%;">
                                          <input class="input is-rounded has-text-grey" @keyup.enter="query" v-model="param" type="search" placeholder="Type to search">
                                          <span class="icon is-small is-left">
                                              <i class="fas fa-search"></i>
                                          </span>
                                      </p>
                                  </div>
                              </div>    
                          </div>
                      </div>
                  </div>
              </nav>
          `,
});

export default navbar;
