import Vue from "vue";

var gofooter = Vue.component("gofooter", {
  props: {
    option: {
      path: "",
      file: {},
    },
  },
  watch: {
    option(val) {
    },
  },
  data: function () {
    return {
      content: "",
    };
  },
  components: {
  },
  methods: {
    render(path) {},
  },
  template: `
  `,
});

export default gofooter;
