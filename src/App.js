import {ApolloProvider} from 'react-apollo'
import gql from 'graphql-tag'
import {Query} from 'react-apollo'
import client from './client'

const ME = gql`
  query me {
    user(login: "yohei0920") {
      name
      avatarUrl
    }
  }
`
function App() {
  return (
    <ApolloProvider client={client}>
      <div>Hello, GraphQL</div>
      <Query query={ME}>
        {
          ({loading, error, data}) => {
            if (loading) return `Loading...`
            if (error) return `Error! ${error.message}`
console.log(error)
            return <div>{data.user.name}</div>
          }
        }
      </Query>
    </ApolloProvider>
  );
}

export default App;
