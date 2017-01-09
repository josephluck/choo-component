const choo = require('choo')
const html = require('choo/html')
const component = require('./index')
const app = choo()

const titleComponent = component({
  model: {
    namespace: 'title',

    state: {
      title: 'Default title'
    },

    reducers: {
      updateTitle (state, payload) {
        return {
          title: payload.title
        }
      }
    }
  },

  view (props) {
    return html`
      <div>
        <input
          value=${props.title}
          oninput=${(e) => {
            props.somethingHappened(e.target.value)
            props.updateTitle({
              title: e.target.value
            })
          }}
        >
        ${props.title}
      </div>
    `
  }
})

app.model(titleComponent.model)

const mainView = (state, prev, send) => {
  const title = titleComponent.component(state, prev, send)

  return html`
    <div>
      <h2>
        Title component demo
      </h2>
      ${title('one', {
        props: {
          somethingHappened (title) {
            console.log('Title one updated', title)
          }
        }
      })}
      <br />
      ${title('two', {
        props: {
          somethingHappened (title) {
            console.log('Title two updated', title)
          }
        },
        initialState: {
          title: 'Easy!'
        }
      })}
    </div>
  `
}

app.router({ default: '/' }, [
  ['/', mainView]
])

document.body.appendChild(app.start())
