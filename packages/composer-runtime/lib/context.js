/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const AclCompiler = require('./aclcompiler');
const AccessController = require('./accesscontroller');
const Api = require('./api');
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const IdentityManager = require('./identitymanager');
const Logger = require('composer-common').Logger;
const LRU = require('lru-cache');
const QueryCompiler = require('./querycompiler');
const QueryExecutor = require('./queryexecutor');
const RegistryManager = require('./registrymanager');
const Resolver = require('./resolver');
const ScriptCompiler = require('./scriptcompiler');
const TransactionLogger = require('./transactionlogger');

const LOG = Logger.getLog('Context');

const businessNetworkCache = LRU(8);
const compiledScriptBundleCache = LRU(8);
const compiledQueryBundleCache = LRU(8);
const compiledAclBundleCache = LRU(8);

/**
 * A class representing the current request being handled by the JavaScript engine.
 * @protected
 * @abstract
 * @memberof module:composer-runtime
 */
class Context {

    /**
     * Store a business network in the cache.
     * @param {string} businessNetworkHash The hash of the business network definition.
     * @param {BusinessNetworkDefinition} businessNetworkDefinition The business network definition.
     */
    static cacheBusinessNetwork(businessNetworkHash, businessNetworkDefinition) {
        const method = 'cacheBusinessNetwork';
        LOG.entry(method, businessNetworkHash, businessNetworkDefinition);
        businessNetworkCache.set(businessNetworkHash, businessNetworkDefinition);
        LOG.exit(method);
    }

    /**
     * Store a compiled script bundle in the cache.
     * @param {string} businessNetworkHash The hash of the business network definition.
     * @param {CompiledScriptBundle} compiledScriptBundle The compiled script bundle.
     */
    static cacheCompiledScriptBundle(businessNetworkHash, compiledScriptBundle) {
        const method = 'cacheCompiledScriptBundle';
        LOG.entry(method, businessNetworkHash, compiledScriptBundle);
        compiledScriptBundleCache.set(businessNetworkHash, compiledScriptBundle);
        LOG.exit(method);
    }

    /**
     * Store a compiled query bundle in the cache.
     * @param {string} businessNetworkHash The hash of the business network definition.
     * @param {CompiledQueryBundle} compiledQueryBundle The compiled query bundle.
     */
    static cacheCompiledQueryBundle(businessNetworkHash, compiledQueryBundle) {
        const method = 'cacheCompiledQueryBundle';
        LOG.entry(method, businessNetworkHash, compiledQueryBundle);
        compiledQueryBundleCache.set(businessNetworkHash, compiledQueryBundle);
        LOG.exit(method);
    }

    /**
     * Store a compiled ACL bundle in the cache.
     * @param {string} businessNetworkHash The hash of the business network definition.
     * @param {CompiledAclBundle} compiledAclBundle The compiled ACL bundle.
     */
    static cacheCompiledAclBundle(businessNetworkHash, compiledAclBundle) {
        const method = 'cacheCompiledAclBundle';
        LOG.entry(method, businessNetworkHash, compiledAclBundle);
        compiledAclBundleCache.set(businessNetworkHash, compiledAclBundle);
        LOG.exit(method);
    }

    /**
     * Constructor.
     * @param {Engine} engine The chaincode engine that owns this context.
     */
    constructor(engine) {
        this.engine = engine;
        this.businessNetworkDefinition = null;
        this.registryManager = null;
        this.resolver = null;
        this.api = null;
        this.queryExecutor = null;
        this.identityManager = null;
        this.participant = null;
        this.transaction = null;
        this.accessController = null;
        this.sysregistries = null;
        this.sysidentities = null;
        this.eventNumber = 0;
        this.scriptCompiler = null;
        this.compiledScriptBundle = null;
        this.queryCompiler = null;
        this.compiledQueryBundle = null;
        this.aclCompiler = null;
        this.compiledAclBundle = null;
    }

    /**
     * Load the business network record from the world state.
     * @return {Promise} A promise that will be resolved with the business network record
     * when complete, or rejected with an error.
     */
    loadBusinessNetworkRecord() {
        const method = 'loadBusinessNetworkRecord';
        LOG.entry(method);
        return this.getDataService().getCollection('$sysdata')
            .then((collection) => {
                LOG.debug(method, 'Getting business network archive from the $sysdata collection');
                return collection.get('businessnetwork');
            })
            .then((object) => {
                // check if the network has been undeployed first. if is has throw exception.
                if (object.undeployed){
                    throw new Error('The business network has been undeployed');
                }
                LOG.exit(object);
                return object;
            });
    }

    /**
     * Load the business network definition.
     * @param {Object} businessNetworkRecord The business network record.
     * @return {Promise} A promise that will be resolved with a {@link BusinessNetworkDefinition}
     * when complete, or rejected with an error.
     */
    loadBusinessNetworkDefinition(businessNetworkRecord) {
        const method = 'loadBusinessNetworkDefinition';
        LOG.entry(method);
        LOG.debug(method, 'Looking in cache for business network', businessNetworkRecord.hash);
        let businessNetworkDefinition = businessNetworkCache.get(businessNetworkRecord.hash);
        if (businessNetworkDefinition) {
            LOG.debug(method, 'Business network is in cache');
            return Promise.resolve(businessNetworkDefinition);
        }
        LOG.debug(method, 'Business network is not in cache, loading');
        let businessNetworkArchive = Buffer.from(businessNetworkRecord.data, 'base64');
        return BusinessNetworkDefinition.fromArchive(businessNetworkArchive)
            .then((businessNetworkDefinition) => {
                Context.cacheBusinessNetwork(businessNetworkRecord.hash, businessNetworkDefinition);
                LOG.exit(method, businessNetworkDefinition);
                return businessNetworkDefinition;
            })
            .catch((error) => {
                LOG.error(method, error);
                throw error;
            });
    }

    /**
     * Load or compile the compiled script bundle.
     * @param {Object} businessNetworkRecord The business network record.
     * @param {BusinessNetworkDefinition} businessNetworkDefinition The business network definition.
     * @return {Promise} A promise that will be resolved with a {@link BusinessNetworkDefinition}
     * when complete, or rejected with an error.
     */
    loadCompiledScriptBundle(businessNetworkRecord, businessNetworkDefinition) {
        const method = 'loadCompiledScriptBundle';
        LOG.entry(method);
        LOG.debug(method, 'Looking in cache for compiled script bundle', businessNetworkRecord.hash);
        let compiledScriptBundle = compiledScriptBundleCache.get(businessNetworkRecord.hash);
        if (compiledScriptBundle) {
            LOG.debug(method, 'Compiled script bundle is in cache');
            return Promise.resolve(compiledScriptBundle);
        }
        LOG.debug(method, 'Compiled script bundle is not in cache, loading');
        return Promise.resolve()
            .then(() => {
                let compiledScriptBundle = this.getScriptCompiler().compile(businessNetworkDefinition.getScriptManager());
                Context.cacheCompiledScriptBundle(businessNetworkRecord.hash, compiledScriptBundle);
                LOG.exit(method, compiledScriptBundle);
                return compiledScriptBundle;
            })
            .catch((error) => {
                LOG.error(method, error);
                throw error;
            });
    }

    /**
     * Load or compile the compiled query bundle.
     * @param {Object} businessNetworkRecord The business network record.
     * @param {BusinessNetworkDefinition} businessNetworkDefinition The business network definition.
     * @return {Promise} A promise that will be resolved with a {@link BusinessNetworkDefinition}
     * when complete, or rejected with an error.
     */
    loadCompiledQueryBundle(businessNetworkRecord, businessNetworkDefinition) {
        const method = 'loadCompiledQueryBundle';
        LOG.entry(method);
        LOG.debug(method, 'Looking in cache for compiled query bundle', businessNetworkRecord.hash);
        let compiledQueryBundle = compiledQueryBundleCache.get(businessNetworkRecord.hash);
        if (compiledQueryBundle) {
            LOG.debug(method, 'Compiled query bundle is in cache');
            return Promise.resolve(compiledQueryBundle);
        }
        LOG.debug(method, 'Compiled query bundle is not in cache, loading');
        return Promise.resolve()
            .then(() => {
                let compiledQueryBundle = this.getQueryCompiler().compile(businessNetworkDefinition.getQueryManager());
                Context.cacheCompiledQueryBundle(businessNetworkRecord.hash, compiledQueryBundle);
                LOG.exit(method, compiledQueryBundle);
                return compiledQueryBundle;
            })
            .catch((error) => {
                LOG.error(method, error);
                throw error;
            });
    }

    /**
     * Load or compile the compiled ACL bundle.
     * @param {Object} businessNetworkRecord The business network record.
     * @param {BusinessNetworkDefinition} businessNetworkDefinition The business network definition.
     * @return {Promise} A promise that will be resolved with a {@link BusinessNetworkDefinition}
     * when complete, or rejected with an error.
     */
    loadCompiledAclBundle(businessNetworkRecord, businessNetworkDefinition) {
        const method = 'loadCompiledAclBundle';
        LOG.entry(method);
        LOG.debug(method, 'Looking in cache for compiled ACL bundle', businessNetworkRecord.hash);
        let compiledAclBundle = compiledAclBundleCache.get(businessNetworkRecord.hash);
        if (compiledAclBundle) {
            LOG.debug(method, 'Compiled ACL bundle is in cache');
            return Promise.resolve(compiledAclBundle);
        }
        LOG.debug(method, 'Compiled ACL bundle is not in cache, loading');
        return Promise.resolve()
            .then(() => {
                let compiledAclBundle = this.getAclCompiler().compile(businessNetworkDefinition.getAclManager(), businessNetworkDefinition.getScriptManager());
                Context.cacheCompiledAclBundle(businessNetworkRecord.hash, compiledAclBundle);
                LOG.exit(method, compiledAclBundle);
                return compiledAclBundle;
            })
            .catch((error) => {
                LOG.error(method, error);
                throw error;
            });
    }

    /**
     * Load the current participant.
     * @return {Promise} A promise that will be resolved with a {@link Resource}
     * when complete, or rejected with an error.
     */
    loadCurrentParticipant() {
        const method = 'loadCurrentParticipant';
        LOG.entry(method);
        let currentUserID = this.getIdentityService().getCurrentUserID();
        LOG.debug(method, 'Got current user ID', currentUserID);
        if (currentUserID) {
            return this.getIdentityManager().getParticipant(currentUserID)
                .then((participant) => {
                    LOG.debug(method, 'Found current participant', participant.getFullyQualifiedIdentifier());
                    LOG.exit(method, participant);
                    return participant;
                })
                .catch((error) => {
                    LOG.error(method, 'Could not find current participant', error);
                    throw new Error(`Could not determine the participant for identity '${currentUserID}'. The identity may be invalid or may have been revoked.`);
                });
        } else {
            // TODO: this is temporary whilst we migrate to requiring all
            // users to have identities that are mapped to participants.
            LOG.debug(method, 'Could not determine current user ID');
            LOG.exit(method, null);
            return Promise.resolve(null);
        }
    }

    /**
     * Get the business network definition to use.
     * @param {Object} [options] The options to use.
     * @param {BusinessNetworkDefinition} [options.businessNetworkDefinition] The business network definition to use.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    findBusinessNetworkDefinition(options) {
        const method = 'findBusinessNetworkDefinition';
        LOG.entry(method, options);
        options = options || {};
        return Promise.resolve()
            .then(() => {
                if (options.businessNetworkDefinition) {
                    LOG.debug(method, 'Business network definition already specified');
                    return options.businessNetworkDefinition;
                } else {
                    LOG.debug(method, 'Business network definition not specified, loading from world state');
                    return this.loadBusinessNetworkRecord()
                        .then((businessNetworkRecord) => {
                            return this.loadBusinessNetworkDefinition(businessNetworkRecord);
                        });
                }
            })
            .then((businessNetworkDefinition) => {
                LOG.exit(method, businessNetworkDefinition);
                return businessNetworkDefinition;
            });
    }

    /**
     * Get the compiled script bundle to use.
     * @param {BusinessNetworkDefinition} businessNetworkDefinition The business network definition to use.
     * @param {Object} [options] The options to use.
     * @param {CompiledScriptBundle} [options.compiledScriptBundle] The business network definition to use.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    findCompiledScriptBundle(businessNetworkDefinition, options) {
        const method = 'findCompiledScriptBundle';
        LOG.entry(method, options);
        options = options || {};
        return Promise.resolve()
            .then(() => {
                if (options.compiledScriptBundle) {
                    LOG.debug(method, 'Compiled script bundle already specified');
                    return options.compiledScriptBundle;
                } else {
                    LOG.debug(method, 'Compiled script bundle not specified, loading from world state');
                    return this.loadBusinessNetworkRecord()
                        .then((businessNetworkRecord) => {
                            return this.loadCompiledScriptBundle(businessNetworkRecord, businessNetworkDefinition);
                        });
                }
            })
            .then((compiledScriptBundle) => {
                LOG.exit(method, compiledScriptBundle);
                return compiledScriptBundle;
            });
    }

    /**
     * Get the compiled query bundle to use.
     * @param {BusinessNetworkDefinition} businessNetworkDefinition The business network definition to use.
     * @param {Object} [options] The options to use.
     * @param {CompiledQueryBundle} [options.compiledQueryBundle] The business network definition to use.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    findCompiledQueryBundle(businessNetworkDefinition, options) {
        const method = 'findCompiledQueryBundle';
        LOG.entry(method, options);
        options = options || {};
        return Promise.resolve()
            .then(() => {
                if (options.compiledQueryBundle) {
                    LOG.debug(method, 'Compiled query bundle already specified');
                    return options.compiledQueryBundle;
                } else {
                    LOG.debug(method, 'Compiled query bundle not specified, loading from world state');
                    return this.loadBusinessNetworkRecord()
                        .then((businessNetworkRecord) => {
                            return this.loadCompiledQueryBundle(businessNetworkRecord, businessNetworkDefinition);
                        });
                }
            })
            .then((compiledQueryBundle) => {
                LOG.exit(method, compiledQueryBundle);
                return compiledQueryBundle;
            });
    }

    /**
     * Get the compiled ACL bundle to use.
     * @param {BusinessNetworkDefinition} businessNetworkDefinition The business network definition to use.
     * @param {Object} [options] The options to use.
     * @param {CompiledAclBundle} [options.compiledAclBundle] The business network definition to use.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    findCompiledAclBundle(businessNetworkDefinition, options) {
        const method = 'findCompiledAclBundle';
        LOG.entry(method, options);
        options = options || {};
        return Promise.resolve()
            .then(() => {
                if (options.compiledAclBundle) {
                    LOG.debug(method, 'Compiled ACL bundle already specified');
                    return options.compiledAclBundle;
                } else {
                    LOG.debug(method, 'Compiled ACL bundle not specified, loading from world state');
                    return this.loadBusinessNetworkRecord()
                        .then((businessNetworkRecord) => {
                            return this.loadCompiledAclBundle(businessNetworkRecord, businessNetworkDefinition);
                        });
                }
            })
            .then((compiledAclBundle) => {
                LOG.exit(method, compiledAclBundle);
                return compiledAclBundle;
            });
    }

    /**
     * Initialize the context for use.
     * @param {Object} [options] The options to use.
     * @param {BusinessNetworkDefinition} [options.businessNetworkDefinition] The business network definition to use.
     * @param {CompiledScriptBundle} [options.compiledScriptBundle] The compiled script bundle to use.
     * @param {boolean} [options.reinitialize] Set to true if being reinitialized as a result of an upgrade to the
     * business network, falsey value if not.
     * @param {DataCollection} [options.sysregistries] The system registries collection to use.
     * @param {DataCollection} [options.sysidentities] The system identities collection to use.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    initialize(options) {
        const method = 'initialize';
        LOG.entry(method, options);
        options = options || {};
        return Promise.resolve()
            .then(() => {
                return this.findBusinessNetworkDefinition(options);
            })
            .then((businessNetworkDefinition) => {
                LOG.debug(method, 'Got business network archive');
                this.businessNetworkDefinition = businessNetworkDefinition;
                return this.findCompiledScriptBundle(this.businessNetworkDefinition, options);
            })
            .then((compiledScriptBundle) => {
                LOG.debug(method, 'Got compiled script bundle');
                this.compiledScriptBundle = compiledScriptBundle;
                return this.findCompiledQueryBundle(this.businessNetworkDefinition, options);
            })
            .then((compiledQueryBundle) => {
                LOG.debug(method, 'Got compiled query bundle');
                this.compiledQueryBundle = compiledQueryBundle;
                return this.findCompiledAclBundle(this.businessNetworkDefinition, options);
            })
            .then((compiledAclBundle) => {
                LOG.debug(method, 'Got compiled ACL bundle');
                this.compiledAclBundle = compiledAclBundle;
                LOG.debug(method, 'Loading sysregistries collection', options.sysregistries);
                if (options.sysregistries) {
                    this.sysregistries = options.sysregistries;
                } else {
                    return this.getDataService().getCollection('$sysregistries')
                        .then((sysregistries) => {
                            this.sysregistries = sysregistries;
                        });
                }
            })
            .then(() => {
                LOG.debug(method, 'Loading sysidentities collection', options.sysidentities);
                if (options.sysidentities) {
                    this.sysidentities = options.sysidentities;
                } else {
                    return this.getDataService().getCollection('$sysidentities')
                        .then((sysidentities) => {
                            this.sysidentities = sysidentities;
                        });
                }
            })
            .then(() => {
                LOG.debug(method, 'Loading current participant');
                return this.loadCurrentParticipant();
            })
            .then((participant) => {
                if (!options.reinitialize) {
                    LOG.debug(method, 'Setting current participant', participant);
                    this.setParticipant(participant);
                } else {
                    // We don't want to change the participant in the middle of a update.
                    LOG.debug(method, 'Reinitializing, not setting current participant', participant);
                }
            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Get all of the services provided by the chaincode container.
     * @return {Service[]} All of the services provided by the chaincode container.
     */
    getServices() {
        return [
            this.getDataService(),
            this.getEventService(),
            this.getIdentityService(),
            this.getHTTPService()
        ];
    }

    /**
     * Get the data service provided by the chaincode container.
     * @abstract
     * @return {DataService} The data service provided by the chaincode container.
     */
    getDataService() {
        throw new Error('abstract function called');
    }

    /**
     * Get the identity service provided by the chaincode container.
     * @abstract
     * @return {IdentityService} The identity service provided by the chaincode container.
     */
    getIdentityService() {
        throw new Error('abstract function called');
    }

    /**
     * Get the http service provided by the chaincode container.
     * @abstract
     * @return {HTTPService} The http service provided by the chaincode container.
     */
    getHTTPService() {
        throw new Error('abstract function called');
    }

    /**
     * Get the event service provided by the chaincode container.
     * @abstract
     * @return {EventService} The event service provided by the chaincode container.
     */
    getEventService() {
        throw new Error('abstract function called');
    }

    /**
     * Get the model manager.
     * @return {ModelManager} The model manager.
     */
    getModelManager() {
        if (!this.businessNetworkDefinition) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetworkDefinition.getModelManager();
    }

    /**
     * Get the script manager.
     * @return {ScriptManager} The script manager.
     */
    getScriptManager() {
        if (!this.businessNetworkDefinition) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetworkDefinition.getScriptManager();
    }

    /**
     * Get the ACL manager.
     * @return {AclManager} The ACL manager.
     */
    getAclManager() {
        if (!this.businessNetworkDefinition) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetworkDefinition.getAclManager();
    }

    /**
     * Get the factory.
     * @return {Factory} The factory.
     */
    getFactory() {
        if (!this.businessNetworkDefinition) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetworkDefinition.getFactory();
    }

    /**
     * Get the serializer.
     * @return {Serializer} The serializer.
     */
    getSerializer() {
        if (!this.businessNetworkDefinition) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetworkDefinition.getSerializer();
    }

    /**
     * Get the introspector.
     * @return {Introspector} The serializer.
     */
    getIntrospector() {
        if (!this.businessNetworkDefinition) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetworkDefinition.getIntrospector();
    }

    /**
     * Get the registry manager.
     * @return {RegistryManager} The registry manager.
     */
    getRegistryManager() {
        if (!this.registryManager) {
            this.registryManager = new RegistryManager(this.getDataService(), this.getIntrospector(), this.getSerializer(), this.getAccessController(), this.getSystemRegistries());
        }
        return this.registryManager;
    }

    /**
     * Get the resolver.
     * @return {Resolver} The resolver.
     */
    getResolver() {
        if (!this.resolver) {
            this.resolver = new Resolver(this.getIntrospector(), this.getRegistryManager());
        }
        return this.resolver;
    }

    /**
     * Get the API.
     * @return {Api} The API.
     */
    getApi() {
        if (!this.api) {
            this.api = new Api(this);
        }
        return this.api;
    }

    /**
     * Get the query executor.
     * @return {QueryExecutor} The query executor.
     */
    getQueryExecutor() {
        if (!this.queryExecutor) {
            this.queryExecutor = new QueryExecutor(this.getResolver());
        }
        return this.queryExecutor;
    }

    /**
     * Get the identity manager.
     * @return {IdentityManager} The identity manager.
     */
    getIdentityManager() {
        if (!this.identityManager) {
            this.identityManager = new IdentityManager(this.getDataService(), this.getRegistryManager(), this.getSystemIdentities());
        }
        return this.identityManager;
    }

    /**
     * Get the current participant.
     * @return {Resource} the current participant.
     */
    getParticipant() {
        return this.participant;
    }

    /**
     * Set the current participant.
     * @param {Resource} participant the current participant.
     */
    setParticipant(participant) {
        if (this.participant) {
            throw new Error('A current participant has already been specified');
        }
        this.participant = participant;
        this.getAccessController().setParticipant(participant);
    }

    /**
     * Get the current transaction.
     * @return {Resource} the current transaction.
     */
    getTransaction() {
        return this.transaction;
    }

    /**
     * Set the current transaction.
     * @param {Resource} transaction the current transaction.
     */
    setTransaction(transaction) {
        if (this.transaction) {
            throw new Error('A current transaction has already been specified');
        }
        this.transaction = transaction;
        this.transactionLogger = new TransactionLogger(this.transaction, this.getRegistryManager(), this.getSerializer());
        this.getAccessController().setTransaction(transaction);
    }

    /**
     * Get the access controller.
     * @return {AccessController} The access controller.
     */
    getAccessController() {
        if (!this.accessController) {
            this.accessController = new AccessController(this.getAclManager(), this.getCompiledAclBundle());
        }
        return this.accessController;
    }

    /**
     * Get the system registries collection.
     * @return {DataCollection} The system registries collection.
     */
    getSystemRegistries() {
        if (!this.sysregistries) {
            throw new Error('must call initialize before calling this function');
        }
        return this.sysregistries;
    }

    /**
     * Get the system identities collection.
     * @return {DataCollection} The system registries collection.
     */
    getSystemIdentities() {
        if (!this.sysidentities) {
            throw new Error('must call initialize before calling this function');
        }
        return this.sysidentities;
    }

    /**
     * Get the next event number
     * @return {integer} the event number.
     */
    getEventNumber() {
        return this.eventNumber;
    }

    /**
     * Incrememnt the event number by 1
     * @return {integer} the event number.
     */
    incrementEventNumber() {
        return this.eventNumber++;
    }

    /**
     * Get the script compiler.
     * @return {ScriptCompiler} scriptCompiler The script compiler.
     */
    getScriptCompiler() {
        if (!this.scriptCompiler) {
            this.scriptCompiler = new ScriptCompiler();
        }
        return this.scriptCompiler;
    }

    /**
     * Get the compiled script bundle.
     * @return {CompiledScriptBundle} compiledScriptBundle The compiled script bundle.
     */
    getCompiledScriptBundle() {
        return this.compiledScriptBundle;
    }

    /**
     * Get the query compiler.
     * @return {QueryCompiler} queryCompiler The query compiler.
     */
    getQueryCompiler() {
        if (!this.queryCompiler) {
            this.queryCompiler = new QueryCompiler();
        }
        return this.queryCompiler;
    }

    /**
     * Get the compiled query bundle.
     * @return {CompiledQueryBundle} compiledQueryBundle The compiled query bundle.
     */
    getCompiledQueryBundle() {
        return this.compiledQueryBundle;
    }

    /**
     * Get the ACL compiler.
     * @return {AclCompiler} aclCompiler The ACL compiler.
     */
    getAclCompiler() {
        if (!this.aclCompiler) {
            this.aclCompiler = new AclCompiler();
        }
        return this.aclCompiler;
    }

    /**
     * Get the compiled ACL bundle.
     * @return {CompiledAclBundle} compiledAclBundle The compiled ACL bundle.
     */
    getCompiledAclBundle() {
        return this.compiledAclBundle;
    }

    /**
     * Called at the start of a transaction.
     * @param {boolean} readOnly Is the transaction read-only?
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionStart(readOnly) {
        const services = this.getServices();
        return services.reduce((promise, service) => {
            return promise.then(() => {
                return service.transactionStart(readOnly);
            });
        }, Promise.resolve());
    }

    /**
     * Called when a transaction is preparing to commit.
     * @abstract
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionPrepare() {
        const services = this.getServices();
        return services.reduce((promise, service) => {
            return promise.then(() => {
                return service.transactionPrepare();
            });
        }, Promise.resolve());
    }

    /**
     * Called when a transaction is rolling back.
     * @abstract
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionRollback() {
        const services = this.getServices();
        return services.reduce((promise, service) => {
            return promise.then(() => {
                return service.transactionRollback();
            });
        }, Promise.resolve());
    }

    /**
     * Called when a transaction is committing.
     * @abstract
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionCommit() {
        const services = this.getServices();
        return services.reduce((promise, service) => {
            return promise.then(() => {
                return service.transactionCommit();
            });
        }, Promise.resolve());
    }

    /**
     * Called at the end of a transaction.
     * @abstract
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionEnd() {
        const services = this.getServices();
        return services.reduce((promise, service) => {
            return promise.then(() => {
                return service.transactionEnd();
            });
        }, Promise.resolve());
    }

}

module.exports = Context;
