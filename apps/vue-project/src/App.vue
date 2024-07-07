<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router"
import HelloWorld from "./components/HelloWorld.vue"
import gql from "graphql-tag"
import { useQuery } from "@vue/apollo-composable"

const POSTS_QUERY = gql`
  query Post {
    post(id: "apollo-federation") {
      content
    }
  }
`
const { result, loading, error } = useQuery(POSTS_QUERY)
</script>

<template>
  <header>
    <img
      alt="Vue logo"
      class="logo"
      src="@/assets/logo.svg"
      width="125"
      height="125"
    />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>

      <p v-if="error">Something went wrong...</p>
      <p v-if="loading">Loading...</p>
      <p v-if="result.post">{{ result.post.content }}</p>
      <a
        href="https://rumblr.auth.ap-southeast-2.amazoncognito.com/login?client_id=7e7uof23b1c9jv2u9jovi108sr&response_type=code&scope=email+openid&redirect_uri=https://d1bgzwpjsndmjc.cloudfront.net/"
        >Login</a
      >
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
