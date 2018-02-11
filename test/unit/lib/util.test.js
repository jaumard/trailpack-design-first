/* eslint-disable no-underscore-dangle */

const assert = require('assert')
const lib = require('../../../lib')
const path = require('path')
const Joi = require('joi')
const definition = require('../../swagger/default.json')

const validHeadersGet = {
  accept: 'application/json'
}
const validHeadersPost = {
  accept: 'application/json',
  'content-type': 'application/x-www-form-urlencoded'
}
const validParams = {
  petId: '12'
}
const validQuery = {
  populate: false
}

describe('lib.Util', () => {
  describe('parseSwaggerDefinition', () => {
    it('Should validate a swagger file', () => {
      return lib.Util.parseSwaggerDefinition(__dirname + '/../../swagger/info.yaml')
    })

    it('Should validate a swagger files', () => {
      return lib.Util.parseSwaggerDefinition([__dirname + '/../../swagger/info.yaml',
        __dirname + '/../../swagger/default.json'])
    })

    it('Should not validate a wrong swagger file', done => {
      lib.Util.parseSwaggerDefinition(__dirname + '/../../swagger/wrong.yaml')
        .then(api => {
          assert(!api)
          done('error, shouldn\'t be correct')
        })
        .catch(err => {
          assert.equal('Swagger schema validation failed. \n' +
            '  Additional properties not allowed: wrong at #/\n' +
            ' \n' +
            'JSON_OBJECT_VALIDATION_FAILED', err.message)
          done()
        })
    })

    it('Should not validate a swagger file that doesn\'t exist', done => {
      lib.Util.parseSwaggerDefinition(__dirname + '/../../swagger/fake.swagger')
        .then(api => {
          assert(!api)
          done('error, shouldn\'t be correct')
        })
        .catch(err => {
          const currentDir = path.join(__dirname, '..', '..')
          const content = `Error opening file "${currentDir}/swagger/fake.swagger" \nENOENT: no such file or directory, open '${currentDir}/swagger/fake.swagger'`
          assert.equal(content, err.message)
          done()
        })
    })
  })

  describe('setupApiFromDefinition', () => {
    it('Should add routes from definition', () => {
      const myApp = { config: { routes: [], policies: {} } }
      return lib.Util.setupApiFromDefinition(definition, myApp)
        .then(_ => {
          assert.equal(5, myApp.config.routes.length)
          assert.equal('PetController.addPet', myApp.config.routes[0].handler)
        })
    })

    it('Should add policies from definition', () => {
      const myApp = { config: { routes: [], policies: {} } }
      return lib.Util.setupApiFromDefinition(definition, myApp)
        .then(_ => {
          assert.equal(1, myApp.config.policies.PetController.addPet.length)
          assert.equal('PassportPolicy.jwt', myApp.config.policies.PetController.addPet[0])
          assert.equal(2, myApp.config.policies.PetController.updatePet.length)
          assert.equal('PassportPolicy.jwt', myApp.config.policies.PetController.updatePet[0])
          assert.equal('PassportPolicy.bearer', myApp.config.policies.PetController.updatePet[1])
        })
    })
  })

  describe('_mapValidations', () => {
    describe('valid headers', () => {
      it('Should map correct validation headers and fail if required', done => {
        const def = lib.Util._mapValidations(definition, definition.paths['/pet/{petId}'].get)
        Joi.validate({
          headers: {},
          params: {},
          query: {},
          payload: {}
        }, def, (err, result) => {
          assert.equal('ValidationError', err.name)
          assert.equal('child "headers" fails because [child "accept" fails because ["accept" is required]]', err.message)
          done()
        })
      })

      it('Should map correct validation headers and fail if wrong', done => {
        const def = lib.Util._mapValidations(definition, definition.paths['/pet/{petId}'].get)
        Joi.validate({
          headers: {
            'accept': 'ko'
          },
          params: {},
          query: {},
          payload: {}
        }, def, (err, result) => {
          assert.equal('ValidationError', err.name)
          assert.equal('child "headers" fails because [child "accept" fails because ["accept" must be one of [application/xml, application/json]]]', err.message)
          done()
        })
      })

      it('Should map correct validation headers and pass if correct', done => {
        const def = lib.Util._mapValidations(definition, definition.paths['/pet/{petId}'].get)
        Joi.validate({
          headers: validHeadersGet,
          params: validParams,
          query: validQuery,
          payload: {}
        }, def, (err, result) => {
          assert(!err)
          done()
        })
      })
    })
    describe('valid params', () => {
      it('Should map correct validation params and fail if required', done => {
        const def = lib.Util._mapValidations(definition, definition.paths['/pet/{petId}'].get)
        Joi.validate({
          headers: validHeadersGet,
          params: {},
          query: {},
          payload: {}
        }, def, (err, result) => {
          assert.equal('ValidationError', err.name)
          assert.equal('child "params" fails because [child "petId" fails because ["petId" is required]]', err.message)
          done()
        })
      })
      it('Should map correct validation params and fail if wrong', done => {
        const def = lib.Util._mapValidations(definition, definition.paths['/pet/{petId}'].get)
        Joi.validate({
          headers: validHeadersGet,
          params: {
            petId: 1.1
          },
          query: validQuery,
          payload: {}
        }, def, (err, result) => {
          assert.equal('ValidationError', err.name)
          assert.equal('child "params" fails because [child "petId" fails because ["petId" must be an integer]]', err.message)
          done()
        })
      })
      it('Should map correct validation params and pass if correct', done => {
        const def = lib.Util._mapValidations(definition, definition.paths['/pet/{petId}'].get)
        Joi.validate({
          headers: validHeadersGet,
          params: {
            petId: 12
          },
          query: validQuery,
          payload: {}
        }, def, (err, result) => {
          assert(!err)
          done()
        })
      })
    })
    describe('valid body', () => {
      it('Should map correct validation body and fail if required', done => {
        const def = lib.Util._mapValidations(definition, definition.paths['/pet/{petId}'].post)
        Joi.validate({
          headers: validHeadersPost,
          params: validParams,
          query: {},
          payload: {}
        }, def, (err, result) => {
          assert.equal('ValidationError', err.name)
          assert.equal('child "payload" fails because [child "name" fails because ["name" is required]]', err.message)
          done()
        })
      })
      it('Should map correct validation body and fail if wrong', done => {
        const def = lib.Util._mapValidations(definition, definition.paths['/pet/{petId}'].post)
        Joi.validate({
          headers: validHeadersPost,
          params: validParams,
          query: {},
          payload: {
            name: 3
          }
        }, def, (err, result) => {
          assert.equal('ValidationError', err.name)
          assert.equal('child "payload" fails because [child "name" fails because ["name" must be a string]]', err.message)
          done()
        })
      })
      it('Should map correct validation body and pass if correct', done => {
        const def = lib.Util._mapValidations(definition, definition.paths['/pet/{petId}'].post)
        Joi.validate({
          headers: validHeadersPost,
          params: validParams,
          query: {},
          payload: {
            name: 'ok'
          }
        }, def, (err, result) => {
          assert(!err)
          done()
        })
      })
    })
    describe('valid query', () => {
      it('Should map correct validation query params and fail if required', done => {
        const def = lib.Util._mapValidations(definition, definition.paths['/pet/{petId}'].get)
        Joi.validate({
          headers: validHeadersGet,
          params: validParams,
          query: {},
          payload: {}
        }, def, (err, result) => {
          assert.equal('ValidationError', err.name)
          assert.equal('child "query" fails because [child "populate" fails because ["populate" is required]]', err.message)
          done()
        })
      })
      it('Should map correct validation query params and fail if wrong', done => {
        const def = lib.Util._mapValidations(definition, definition.paths['/pet/{petId}'].get)
        Joi.validate({
          headers: validHeadersGet,
          params: validParams,
          query: {
            populate: 'ko'
          },
          payload: {}
        }, def, (err, result) => {
          assert.equal('ValidationError', err.name)
          assert.equal('child "query" fails because [child "populate" fails because ["populate" must be a boolean]]', err.message)
          done()
        })
      })
      it('Should map correct validation query params and pass if correct', done => {
        const def = lib.Util._mapValidations(definition, definition.paths['/pet/{petId}'].get)
        Joi.validate({
          headers: validHeadersGet,
          params: validParams,
          query: validQuery,
          payload: {}
        }, def, (err, result) => {
          assert(!err)
          done()
        })
      })
    })
  })
})

