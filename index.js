const html = require('choo/html')
const assert = require('assert')

// Create onload and onunload reducers to initiate and
// garbage collect an instance of a component when
// onload and onunload lifecycle methods are called
// setup sets the default state in the component
// and teardown removes an instance from the state
const defaultReducers = () => {
  return {
    setup (state, payload) {
      return {
        instances: {
          ...state.instances,
          [payload.instanceId]: payload.initialState
        }
      }
    },
    teardown (state, payload) {
      return {
        instances: Object.keys(state.instances)
          .filter((key) => key !== payload.instanceId)
          .reduce((curr, prev) => Object.assign({}, state.instances[curr], prev), {})
      }
    }
  }
}

// Wrap reducers so that functions in the component
// receive instance state rather than global state
// note that for this to work, reducers need to be
// send object payloads. Reducers then only need
// to return an updated instance state and do not
// need to worry about other instances
const decorateReducers = (reducers) => {
  return Object.keys(reducers).reduce((curr, key) => {
    const enhancedPayload = (state, payload) => {
      return {
        instances: {
          ...state.instances,
          [payload.instanceId]: {
            ...state.instances[payload.instanceId],
            ...reducers[key](state.instances[payload.instanceId], payload)
          }
        }
      }
    }
    return {
      ...curr,
      [key]: enhancedPayload
    }
  }, {})
}

// Wrap effects so that they do not need to know
// about instances or instanceIds. We create a new send
// function that adds the instanceId to the payload so
// that the above reducers know what to do.
// Note for this to work, the effect payload
// needs to be an object, and all reducer payloads
// need to be objects
const decorateEffects = (effects, instanceId) => {
  return Object.keys(effects).reduce((curr, key) => {
    return {
      ...curr,
      [key]: (state, payload, send, done) => {
        const newSend = (name, reducerPayload) => {
          if (reducerPayload) {
            assert.equal(typeof reducerPayload, 'object', 'Reducer payload must be an object')
          }
          send(name, {
            ...reducerPayload,
            instanceId: payload.instanceId
          })
        }
        effects[key](state, payload, newSend, done)
      }
    }
  }, {})
}

// Create glue between the components methods and
// the components reducers.
// note that for this to work, reducers & effects
// need to be send object payloads
const generateBehaviour = (reducers, effects, send, instanceId, namespace, state) => {
  return Object.keys(reducers).concat(Object.keys(effects)).reduce((curr, key) => {
    return {
      ...curr,
      [key]: (payload) => {
        assert.equal(typeof payload, 'object', `reducer ${key}: payload must be an object`)
        send(`${namespace}:${key}`, { instanceId: instanceId, ...payload })
      }
    }
  }, {})
}

module.exports = (component) => {
  assert.equal(typeof component, 'object', 'Component must be an object')
  assert.equal(typeof component.view, 'function', 'Components view must be a function')
  assert.equal(typeof component.model, 'object', 'Components model must be an object')
  assert.equal(typeof component.model.namespace, 'string', 'Components model must have a namespace')
  assert.equal(typeof component.model.reducers, 'object', 'Components model have a reducers object')

  const reducers = {
    ...decorateReducers(component.model.reducers ? component.model.reducers : {}),
    ...defaultReducers()
  }
  const effects = decorateEffects(component.model.effects ? component.model.effects : {})

  return {
    model: {
      namespace: component.model.namespace,
      state: {
        instances: {}
      },
      reducers: reducers,
      effects: effects
    },
    component (globalState, prev, send) {
      return function (instanceId, params) {
        assert.equal(typeof instanceId, 'string', 'Component instance must have an instanceId')
        const behaviour = generateBehaviour(reducers, effects, send, instanceId, component.model.namespace, globalState)
        const props = params ? params.props : {}
        const currentInstanceState = globalState[component.model.namespace].instances[instanceId]
          ? globalState[component.model.namespace].instances[instanceId]
          : component.model.state
            ? component.model.state
            : {}
        const initialState = params && params.initialState
          ? params.initialState
          : component.model.state
            ? component.model.state
            : {}

        // Although we have class here so it gives the
        // end user an opportunity to style the wrapping
        // elm, it's not the instanceIdeal situation. It would
        // be better if the end user could specify the
        // tag.
        return html`
          <div
            class=${component.className || ''}
            onload=${() => {
              send(`${component.model.namespace}:setup`, {
                instanceId: instanceId,
                initialState: initialState
              })
            }}
            onunload=${() => {
              send(`${component.model.namespace}:clear`, {
                instanceId: instanceId
              })
            }}
          >
            ${component.view({
              ...behaviour,
              ...props,
              ...currentInstanceState
            })}
          </div>
        `
      }
    }
  }
}
