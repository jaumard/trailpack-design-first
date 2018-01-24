const { promisify } = require('util')
const exists = promisify(require('fs').exists)
const Joi = require('joi')
const SwaggerParser = require('swagger-parser')

module.exports = {
  parseSwaggerDefinition(path) {
    return exists(path).then(() => SwaggerParser.validate(path))
  },

  setupSwaggerExposition(app) {
    app.config.routes.push({
      method: ['GET'],
      path: app.config.swagger.swaggerDefinitionHttpPath,
      handler: {
        directory: {
          path: app.config.swagger.swaggerDefinition
        }
      }
    })
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

  setupApiFromDefinition(definition, app) {
    const operations = definition.paths
    const basePath = definition.basePath
    Object.keys(operations).forEach(path => {
      const methods = operations[path]
      Object.keys(methods).forEach(method => {
        const methodDefinition = methods[method]
        app.config.routes.push({
          method: method.toUpperCase(),
          path: basePath + path,
          handler: methodDefinition.operationId,
          config: {
            validate: this._mapValidations(definition, methodDefinition),
            pre: []
          }
        })
      })
    })

    return Promise.resolve()
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
        validation.headers = Joi.object(headersValidation).options({
          allowUnknown: true
        })
      }
      else {
        validation.headers = Joi.object({}).allow(null)
      }
      if (Object.keys(paramsValidation).length > 0) {
        validation.params = Joi.object(paramsValidation)
      }
      else {
        validation.params = Joi.object({}).allow(null)
      }
      if (Object.keys(queryValidation).length > 0) {
        validation.query = Joi.object(queryValidation)
      }
      else {
        validation.query = Joi.object({}).allow(null)
      }
      if (Object.keys(bodyValidation).length > 0) {
        validation.payload = bodyValidation
      }
      else {
        validation.payload = Joi.object({}).allow(null)
      }
    }

    return validation
  }
}
