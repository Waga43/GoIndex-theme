import Vue from "vue";

let breadcrumb = Vue.component("breadcrumb", {
  data: function () {
    return {
      navs: [],
    };
  },
  template: `
          <nav class="breadcrumb" aria-label="breadcrumbs">
              <ul>
                  <li v-for="(item,index) in navs" :class="(index+1)==navs.length?'is-active':''">
                      <a v-if="(index+1)==navs.length" aria-current="page" href="#">{{item.title}}</a>
                      <a v-else :href="item.path">{{item.title}}</a>
                  </li>
              </ul>
          </nav>
      `,
  methods: {
    render(path) {
      // If search, it will not be rendered
      if (path.match("/[0-9]+:search")) {
        return;
      }
      var arr = path.trim("/").split("/");
      var p = "/";
      if (arr.length > 0) {
        var navs = [];
        for (var i in arr) {
          var n = arr[i];
          if (n == "") {
            continue;
          }
          n = decodeURI(n);
          p += n + "/";
          if (p.match("/[0-9]+:/")[0] === p) {
            n = "Home";
          }
          navs.push({
            path: p,
            title: n,
          });
        }
        this.navs = navs;
        if (navs.length == 1 && navs[0].title === "Home") {
          this.navs = [];
        }
      }
    },
  },
});

export default breadcrumb;
