import React, { Component } from 'react'
import { ApolloProvider, Mutation, Query } from 'react-apollo'
import client from './client'
import { ADD_STAR, REMOVE_STAR, SEARCH_REPOSITORIES } from './graphql'

const StarButton = props => {
  const { node, query, first, last, before, after } = props
  const totalCount = node.stargazers.totalCount
  const viewerHasStarred = node.viewerHasStarred
  const starCount = totalCount === 1 ? "1 star" : `${totalCount} stars`
  const StarStatus = ({addOrRemoveStar}) => {
    return (
      <button
        onClick={
          () => addOrRemoveStar({
            variables: { input: { starrableId: node.id } },
            update: (store, { data: { addStar, removeStar }}) => {
              const { starrable } = addStar || removeStar
              console.log(starrable)
              const data = store.readQuery({
                query: SEARCH_REPOSITORIES,
                variables:  { query, first, last, after, before }
              })
              const edges = data.search.edges
              const newEdges = edges.map(edge => {
                if (edge.node.id === node.id) {
                  const totalCount = edge.node.stargazers.totalCount
                  const diff = starrable.viewerHasStarred ? 1 : -1
                  const newTotalCount = totalCount + diff
                  edge.node.stargazers.totalCount = newTotalCount
                }
                return edge
              })
              data.search.edges = newEdges
              store.writeQuery({ query: SEARCH_REPOSITORIES, data })
            }
          })
        }
      >
        {starCount} | {viewerHasStarred ? 'starred' : '-'}
      </button>
    )
  }

  return (
    <Mutation
      mutation={viewerHasStarred ? REMOVE_STAR : ADD_STAR}
    >
      {
        addOrRemoveStar => <StarStatus addOrRemoveStar={addOrRemoveStar} />
      }
    </Mutation>
  )
}

const PER_PAGE = 5
const DEFAULT_STATE = {
  first: PER_PAGE,
  after: null,
  last: null,
  before: null,
  query: ""
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = DEFAULT_STATE

    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange(event) {
    this.setState({
      ...DEFAULT_STATE,
      query: event.target.value
    })
  }

  handleSubmit(event) {
    event.preventDefault()
  }

  goPrevious(search) {
    this.setState({
      first: null,
      after: null,
      last: PER_PAGE,
      before: search.pageInfo.startCursor
    })
  }

  goNext(search) {
    this.setState({
      first: PER_PAGE,
      after: search.pageInfo.endCursor,
      last: null,
      before: null
    })
  }

  render() {
    const { query, first, last, before, after } = this.state

    return (
      <ApolloProvider client={client}>
        <form onSubmit={this.handleSubmit}>
          <input value={query} onChange={this.handleChange} />
        </form>
        <Query
          query={SEARCH_REPOSITORIES}
          variables={{ query, first, last, before, after }}
        >
          {
            ({ loading, error, data }) => {
              if (loading) return 'Loading...'
              if (error) return `Error! ${error.message}`
              console.log({data})

              const search = data.search
              const repositoryCount = search.repositoryCount
              const SINGLE_REPOSITORY = 1
              const repositoryUnit = repositoryCount === SINGLE_REPOSITORY ? 'Repository' : 'Repositories'
              const title = `GitHub Repositories Search Results - ${repositoryCount} ${repositoryUnit}`
              return (
                <React.Fragment>
                  <h2>
                    {title}
                  </h2>
                  <ul>
                    {
                      search.edges.map(edge => {
                        const node = edge.node
                        console.log(node.id)

                        return (
                          <li key={node.id}>
                            <a href={node.url} target="_blank" rel="noopener noreferrer">{node.name}</a>
                            &nbsp;
                            <StarButton node={node} {...{query, first, last, after, before}}/>
                          </li>
                        )
                      })
                    }
                  </ul>

                  {
                    search.pageInfo.hasPreviousPage === true ?
                      <button
                        onClick={this.goPrevious.bind(this, search)}
                      >
                        Previous
                      </button>
                      :
                      null
                  }
                  {
                    search.pageInfo.hasNextPage === true ?
                      <button
                        onClick={this.goNext.bind(this, search)}
                      >
                        Next
                      </button>
                      :
                      null
                  }
                </React.Fragment>
              )
            }
          }
        </Query>
      </ApolloProvider>
    )
  }
}

export default App
