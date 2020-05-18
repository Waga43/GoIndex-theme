import Vue from "vue";
import { get_file } from "@/utils/AcrouUtil";

var gocheck = Vue.component("gocheck", {
  created() {
    if(!window.gdconfig){
      this.show = true
    }
  },
  data: function () {
    return {
      show: false,
    };
  },
  components: {
  },
  methods: {
    close() {
      this.show = false
    }
  },
  template: `
  `,
});

export default gocheck;
