const choo = require('choo')
const html = require('choo/html')
const component = require('./component')
const app = choo()

const counterComponent = component({
  model: {
    namespace: 'counter',

    state: {
      count: 0
    },

    reducers: {
      increment (state, payload) {
        const newCount = state.count + 1
        payload.onIncrement(newCount)
        return {
          count: newCount
        }
      }
    }
  },

  view (props) {
    return html`
      <button
        onclick=${() => {
          props.increment({
            onIncrement: props.onIncrement
          })
        }}
      >
        Increment ${props.count}
      </button>
    `
  }
})

app.model(counterComponent.model())

const mainView = (state, prev, send) => {
  const counter = counterComponent.component(state, prev, send)

  return html`
    <div>
      <h2>
        Counter component demo
      </h2>
      ${counter('one', {
        props: {
          onIncrement (count) {
            console.log('Counter one incremented', count)
          }
        }
      })}
      <br />
      ${counter('two', {
        props: {
          onIncrement (count) {
            console.log('Counter two incremented', count)
          }
        },
        initialState: {
          count: 10
        }
      })}
    </div>
  `
}

app.router({ default: '/' }, [
  ['/', mainView]
])

document.body.appendChild(app.start())
