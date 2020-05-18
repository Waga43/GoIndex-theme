import Vue from "vue";
import { get_file } from "../utils/AcrouUtil";

var gohtml = Vue.component("gohtml", {
  props: {
    option: {
      path: "",
      file: {},
    },
  },
  watch: {
    option(val) {
      this.loading = true;
      get_file(this.option, (data) => {
        this.content = data;
        this.loading = false;
      });
    },
  },
  data: function () {
    return {
      loading: true,
      content: "",
    };
  },
  mounted() {
    const oIframe = document.getElementById("iframe");
    const deviceHeight = document.documentElement.clientHeight;
    oIframe.style.height = Number(deviceHeight) + "px";
  },
  methods: {
  },
  template: `
  `,
});

export default gohtml;
