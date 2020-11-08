# Hands on tech lab

Welcome to *86 400* tech lab! This repository represents a small piece of the *86 400* code base. The intent of this lab is to provide an opportunity to get an insight into one's coding style, ability and thought process - also as an opportunity to learn from each other!

## About

A simple HTTP client to fetch JWT tokens from an IAM provider (in this case [Keycloak](https://www.keycloak.org/)).

This client is intended to be published as a private npm package that is then internally used by other services within *86 400* to retrieve service account JWT tokens.

# Branch t2 - Fix some more tests

* Re-run `npm test` - some tests in `keycloakRealmClient.spec.ts` are now failing - see if you can trouble shoot the root cause and change the code that will then pass the tests!
