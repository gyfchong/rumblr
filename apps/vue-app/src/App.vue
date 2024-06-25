<script>
import gql from "graphql-tag";
import { useQuery } from "@vue/apollo-composable";

const POSTS_QUERY = gql`
  query Post {
    post(id: "apollo-federation") {
      content
    }
  }
`;

export default {
  name: "App",
  setup() {
    const { result, loading, error } = useQuery(POSTS_QUERY);
    console.info("result", result);
    return {
      result: result.value,
      loading,
      error,
    };
  },
};
</script>

<template>
  <nav>
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link>
  </nav>
  <p v-if="error">Something went wrong...</p>
  <p v-if="loading">Loading...</p>
  <p v-if="result.post">{{ result.post.content }}</p>
  <div></div>
  <router-view />
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>
