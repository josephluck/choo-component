# Choo components

[![Greenkeeper badge](https://badges.greenkeeper.io/josephluck/choo-component.svg)](https://greenkeeper.io/)

A super helpful library to imitate reusable stateful components in Choo.

## Useage

### Creating a component

```javascript
// titleComponent.js
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
```

A component's definition must include a model which is an object containing the following.

1. `namespace` (required) - a unique namespace to store instances of this component in your choo global state
2. `state` - default state for an instance of a component
3. `reducers` (required) - an object containing methods to update the internal state of the component. Note that reducers receive current instance's state in it's first argument, and must return updated state for the instance
4. `effects` - an object containing effects. You will notice that the payload for effects will have an `instanceId` key. Don't worry about it, this is used internally to figure out which component you are updating

The model must have a unique namespace, state (the default state of a new component) and reducers. Reducers receive the state of the current instance, and must return updated state of that instance.

A component's definition must also include a view. The view receives a props object that contains a flattened object of the following:

1. Current state of the instance
2. Methods that correspond to reducer methods
3. Props passed from the parent component

When calling reducers from the view, you must pass an object as the payload or bad things will happen!

The above example will export an object containing model and a component. See the sections below for useage.

### Using a component in your app

First, register the model in your app.

```javascript
// app.js
const titleModel = require('./titleComponent').model
app.model(titleModel)
```

For views, you first need to instantiate the component by passing `state`, `prev` and `send` to it. Next, create an instance of a component by calling the result of the instantiation. An instance expects the following:

1. A unique identifier for the component. This needs to be completely unique, and should not change between re-renders of your view. It's how the component knows which slice of state it belongs to
2. An optional object containing the following:
2.1 `props` - external properties you would like to propagate to your components `view`. This is useful for callbacks or component customisation
2.2 `initialState` - this is generally not used, but can be used to override `state` from the model during the setup stage of a component. Alternatively, you can manually call the reducer from outside your component to achieve the same result

```javascript
// app.js
const titleComponent = require('./titleComponent').component
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
```

*Note that your component must be initiated in a page that has access to state, prev and send*

### Altogether now

```javascript
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
```

##44