import './assets/main.css'

import { createApp, provide, h } from 'vue'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'

import App from './App.vue'
import router from './router'
const cache = new InMemoryCache()

const apolloClient = new ApolloClient({
  cache,
  uri: 'https://cixozlje55czlcocuzozpqcaxq.appsync-api.ap-southeast-2.amazonaws.com/graphql',
  headers: {
    'x-api-key': 'da2-ozcyrvcfqrg7dfmi5kege25bom'
  }
})

createApp({
  setup() {
    provide(DefaultApolloClient, apolloClient)
  },

  render: () => h(App)
})
  .use(router)
  .mount('#app')
