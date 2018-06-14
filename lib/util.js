const { promisify } = require('util')
const exists = promisify(require('fs').exists)
const Joi = require('joi')
const path = require('path')
const SwaggerParser = require('swagger-parser')

const POLICY_KEY = 'x-swagger-router-policies'
const CONTROLLER_KEY = 'x-swagger-router-controller'

module.exports = {
  parseSwaggerDefinition(filePath) {
    if (Array.isArray(filePath)) {
      return Promise.all(filePath.map(file => exists(file).then(() => SwaggerParser.validate(file))))
    }
    else {
      return exists(filePath).then(() => SwaggerParser.validate(filePath)).then(definition => [definition])
    }
  },

  setupSwaggerExposition(app) {
    const definitionFiles = app.config.swagger.swaggerDefinition
    if (Array.isArray(definitionFiles)) {
      const folders = []
      definitionFiles.map(definitionFile => {
        const dir = path.dirname(definitionFile)
        if (folders.indexOf(dir) === -1) {
          folders.push(dir)
          app.config.routes.push({
            method: ['GET'],
            path: app.config.swagger.swaggerDefinitionHttpPath,
            handler: {
              directory: {
                path: dir
              }
            }
          })
        }
      })
    }
    else {
      app.config.routes.push({
        method: ['GET'],
        path: app.config.swagger.swaggerDefinitionHttpPath,
        handler: {
          directory: {
            path: path.dirname(definitionFiles)
          }
        }
      })
    }

    app.config.routes.push({
      method: ['GET'],
      path: app.config.swagger.swaggerUiHttpPath,
      handler: {
        directory: {
          path: app.config.swagger.swaggerUi
        }
      }
    })
  },

  setupApiFromDefinitions(definitions, app) {
    return Promise.all(definitions.map(definition => this.setupApiFromDefinition(definition, app)))
  },

  setupApiFromDefinition(definition, app) {
    const operations = definition.paths
    const basePath = definition.basePath
    const baseSecurity = definition.security
    const securityDefinitions = definition.securityDefinitions
    Object.keys(operations).forEach(path => {
      const methods = operations[path]
      let controller = methods[CONTROLLER_KEY]
      const policies = methods[POLICY_KEY]
      if (controller) {
        controller += '.'
      }
      else {
        controller = ''
      }

      Object.keys(methods).forEach(method => {
        if (method !== CONTROLLER_KEY) {
          const methodDefinition = methods[method]
          const security = methodDefinition.security || baseSecurity
          let methodController = controller
          let methodPolicies = policies
          if (methodDefinition[CONTROLLER_KEY]) {
            methodController = methodDefinition[CONTROLLER_KEY] + '.'
          }
          if (methodDefinition[POLICY_KEY]) {
            methodPolicies = methodDefinition[POLICY_KEY]
          }
          if (methodPolicies) {
            methodPolicies = methodPolicies.split(',').map(item => item.trim())
          }
          else {
            methodPolicies = []
          }
          if (security && security.length > 0) {
            for (let i = 0; i < security.length; i++) {
              const securityItem = security[i]
              let securityPolicies = []
              Object.keys(securityItem).forEach(name => {
                const securityDefinition = securityDefinitions[name]
                if (securityDefinition[POLICY_KEY]) {
                  securityPolicies = securityDefinition[POLICY_KEY].split(',').map(item => item.trim())
                }
              })
              methodPolicies = securityPolicies.concat(methodPolicies)
            }
          }
          const handler = methodController + methodDefinition.operationId
          methodPolicies.map(policy => {
            this._addPolicy(app, policy, handler)
          })
          app.config.routes.push({
            method: method.toUpperCase(),
            path: basePath + path,
            handler: handler,
            config: {
              validate: this._mapValidations(definition, methodDefinition)
            }
          })
        }
      })
    })

    return Promise.resolve()
  },

  _addPolicy(app, policyName, handlerName) {
    const handlerParts = handlerName.split('.')
    if (!app.config.policies[handlerParts[0]]) {
      app.config.policies[handlerParts[0]] = {}
    }
    const existingPolicies = app.config.policies[handlerParts[0]][handlerParts[1]] || []
    existingPolicies.push(policyName)
    app.config.policies[handlerParts[0]][handlerParts[1]] = existingPolicies
  },

  _getJoiValidation(description) {
    if (!description) {
      return null
    }
    let type = description.type
    switch (description.format) {
      case 'int32':
      case 'int64':
        type = 'integer'
        break
      case 'float':
      case 'double':
        type = 'double'
        break
      case 'byte':
        type = 'byte'
        break
      case 'binary':
        type = 'binary'
        break
    }

    let joi
    switch (type) {
      case 'object': {
        const props = {}
        Object.keys(description.properties).forEach(key => {
          const prop = description.properties[key]
          if (description.required && description.required.length > 0) {
            prop.required = description.required.find(item => key === item)
          }
          props[key] = this._getJoiValidation(prop)
        })
        joi = Joi.object(props)
        break
      }
      case 'array': {
        joi = Joi.array().items(this._getJoiValidation(description.items))
        break
      }
      case 'byte': {
        joi = Joi.base64()
        break
      }
      case 'date':
      case 'dateTime': {
        joi = Joi.date()
        break
      }
      case 'integer':
        joi = Joi.number().integer()
        break
      case 'long':
        joi = Joi.number()
        break
      case 'float':
        joi = Joi.number()
        break
      case 'double':
        joi = Joi.number()
        break
      case 'boolean':
        joi = Joi.boolean()
        break
      default: {
        joi = Joi.string()
      }
    }
    if (description.pattern) {
      joi = joi.regex(description.pattern)
    }
    if (description.length) {
      joi = joi.length(description.length)
    }
    if (description.maxItems || description.maxLength) {
      joi = joi.max(description.maxItems || description.maxLength)
    }
    if (description.minItems || description.minLength) {
      joi = joi.min(description.minItems || description.minLength)
    }
    if (description.enum) {
      joi = joi.valid(...description.enum)
    }
    if (description.maximum) {
      joi = joi.max(description.maximum)
    }
    if (description.minimum) {
      joi = joi.min(description.minimum)
    }
    if (description.required) {
      joi = joi.required()
    }
    return joi
  },

  _mapValidations(definition, methodDefinition) {
    const validation = {}
    const headersValidation = {}
    const queryValidation = {}
    const paramsValidation = {}
    let bodyValidation = {}
    if (methodDefinition['consumes'] && methodDefinition['consumes'].length > 0) {
      headersValidation['content-type'] = Joi.string().valid(...methodDefinition['consumes']).required()
    }
    if (methodDefinition['produces'] && methodDefinition['produces'].length > 0) {
      headersValidation['accept'] = Joi.string().valid(...methodDefinition['produces']).required()
    }

    if (methodDefinition['parameters'] && methodDefinition['parameters'].length > 0) {
      methodDefinition['parameters'].forEach(param => {
        switch (param.in) {
          case 'query':
            queryValidation[param.name] = this._getJoiValidation(param)
            break
          case 'path':
            paramsValidation[param.name] = this._getJoiValidation(param)
            break
          case 'body': {
            const description = param.schema
            if (description.type === 'array') {
              bodyValidation = this._getJoiValidation(description)
            }
            else if (description.type === 'object') {
              Object.keys(description.properties).forEach(key => {
                const prop = description.properties[key]
                if (description.required && description.required.length > 0) {
                  prop.required = description.required.find(item => key === item)
                }
                bodyValidation[key] = this._getJoiValidation(prop)
              })
              bodyValidation = Joi.object(bodyValidation)
            }
            break
          }
          case 'formData':
            bodyValidation[param.name] = this._getJoiValidation(param)
            break
          case 'header':
            headersValidation[param.name.toLowerCase()] = this._getJoiValidation(param)
            break
        }
      })
      if (Object.keys(headersValidation).length > 0) {
        validation.headers = Joi.object(headersValidation).unknown(true)
      }
      else {
        validation.headers = Joi.object({}).unknown(true)
      }
      if (Object.keys(paramsValidation).length > 0) {
        validation.params = Joi.object(paramsValidation)
      }
      else {
        validation.params = Joi.object({})
      }
      if (Object.keys(queryValidation).length > 0) {
        validation.query = Joi.object(queryValidation)
      }
      else {
        validation.query = Joi.object({})
      }
      if (Object.keys(bodyValidation).length > 0) {
        validation.payload = bodyValidation
      }
      else {
        validation.payload = Joi.object({})
      }
    }

    return validation
  }
}
