import Emitter from 'tiny-emitter';
import { safeHtml } from 'common-tags';

import debug from './utils/debug';
import defaults from './defaults';
import settings from './settings';

class HelloSign extends Emitter {

  /**
   * HelloSign Embedded class names.
   *
   * @enum {string}
   * @static
   * @readonly
   */
  static classNames = settings.classNames;

  /**
   * HelloSign Embedded events.
   *
   * @enum {string}
   * @static
   * @readonly
   */
  static events = settings.events;

  /**
   * HelloSign Embedded supported locales.
   *
   * @enum {string}
   * @static
   * @readonly
   */
  static locales = settings.locales;

  /**
   * HelloSign Embedded cross-origin window messages.
   *
   * @enum {string}
   * @static
   * @readonly
   */
  static messages = settings.messages;

  /**
   * HelloSign Embedded version number.
   *
   * @enum {string}
   * @static
   * @readonly
   */
  static version = __PKG_VERSION__;

  /**
   * The base config object which "open" will extend.
   *
   * @type {?Object}
   * @private
   */
  _baseConfig = null;

  /**
   * A reference to the base HelloSign Embedded container
   * element.
   *
   * @type {?HTMLElement}
   * @private
   */
  _baseEl = null;

  /**
   * The final config object.
   *
   * @type {?Object}
   * @private
   */
  _config = null;

  /**
   * The embedded flow type.
   *
   * @type {?string}
   * @private
   */
  _embeddedType = null;

  /**
   * The iFrame URL object.
   *
   * @type {?URL}
   * @private
   */
  _iFrameURL = null;

  /**
   * A reference to the iFrame element.
   *
   * @type {?HTMLElement}
   * @private
   */
  _iFrameEl = null;

  /**
   * The initialization tmieout timer.
   *
   * @type {?number}
   * @private
   */
  _initTimeout = null;

  /**
   * Whether the client is open or not.
   *
   * @type {?boolean}
   * @private
   */
  _isOpen = false;

  /**
   * @type {Function}
   * @private
   */
  _onEmbeddedClick = this._onEmbeddedClick.bind(this);

  /**
   * @type {Function}
   * @private
   */
  _onInitTimeout = this._onInitTimeout.bind(this);

  /**
   * @type {Function}
   * @private
   */
  _onMessage = this._onMessage.bind(this);

  /**
   * Creates a new HelloSign Embedded instance.
   *
   * @param {Object} [obj]
   * @constructor
   */
  constructor(obj = {}) {
    super();

    debug.info('created new HelloSign instance with options', obj);

    if (obj && typeof obj === 'object') {
      this._baseConfig = { ...obj };
    } else {
      throw new TypeError('Configuration must be an object');
    }
  }

  /**
   * Validates and appends the clientId parameter to the
   * iFrame params object.
   *
   * @throws {TypeError} if clientId is invalid
   * @param {URLSearchParams} params
   * @private
   */
  _applyClientId(params) {
    const val = this._config.clientId;

    if (!val) {
      throw new TypeError('"clientId" is required');
    }

    if (typeof val !== 'string') {
      throw new TypeError('"clientId" must be a string');
    }

    params.append('client_id', val);
  }

  /**
   * Validates and appends the debug parameter to the
   * iFrame params object.
   *
   * @throws {TypeError} if debug is invalid
   * @param {URLSearchParams} params
   * @private
   */
  _applyDebug(params) {
    const val = this._config.debug;

    if (typeof val !== 'boolean') {
      throw new TypeError('"debug" must be a boolean');
    }

    params.append('debug', val ? 1 : 0);
  }

  /**
   * Validates and appends the finalButtonText parameter to
   * the iFrame params object.
   *
   * @throws {TypeError} if finalButtonText is invalid
   * @param {URLSearchParams} params
   * @private
   */
  _applyFinalButtonText(params) {
    if ('finalButtonText' in this._config) {
      const val = this._config.finalButtonText;

      if (typeof val !== 'string') {
        throw new TypeError('"finalButtonText" must be a string');
      }

      if (!['Send', 'Continue'].includes(val)) {
        throw new TypeError('"finalButtonText" must be either "Send" or "Continue"');
      }

      params.append('final_button_text', val);
    }
  }

  /**
   * Validates and appends the hideHeader parameter to the
   * iFrame params object.
   *
   * @throws {TypeError} if hideHeader is invalid
   * @param {URLSearchParams} params
   * @private
   */
  _applyHideHeader(params) {
    if ('hideHeader' in this._config) {
      const val = this._config.hideHeader;

      if (typeof val !== 'boolean') {
        throw new TypeError('"hideHeader" must be a boolean');
      }

      params.append('hideHeader', val);
    }
  }

  /**
   * Validates and appends the locale parameter to the
   * iFrame params object.
   *
   * @throws {TypeError} if locale is invalid
   * @param {URLSearchParams} params
   * @private
   */
  _applyLocale(params) {
    const val = this._config.locale;

    if (typeof val !== 'string') {
      throw new TypeError('"locale" must be a string');
    }

    if (!Object.values(settings.locales).includes(val)) {
      throw new TypeError(`"${val}" is not a supported locale`);
    }

    params.append('user_culture', val);
  }

  /**
   * Appends the parentUrl parameter to the iFrame params
   * object.
   *
   * @param {URLSearchParams} params
   * @private
   */
  _applyParentURL(params) {
    params.append('parent_url', document.location.href);
  }

  /**
   * Validates and appends the redirectTo parameter to the
   * iFrame params object.
   *
   * @throws {TypeError} if redirectTo is invalid
   * @param {URLSearchParams} params
   * @private
   */
  _applyRedirectTo(params) {
    if ('redirectTo' in this._config) {
      const val = this._config.redirectTo;

      if (typeof val !== 'string') {
        throw new TypeError('"redirectTo" must be a string');
      }

      params.append('redirect_url', val);
    }
  }

  /**
   * Validates and appends the requestingEmail parameter to
   * the iFrame params object.
   *
   * @throws {TypeError} if requestingEmail is invalid
   * @param {URLSearchParams} params
   * @private
   */
  _applyRequestingEmail(params) {
    if ('requestingEmail' in this._config) {
      const val = this._config.requestingEmail;

      if (typeof val !== 'string') {
        throw new TypeError('"requestingEmail" must be a string');
      }

      params.append('requester', val);
    }
  }

  /**
   * Validates and appends the skipDomainVerification
   * parameter to the iFrame params object.
   *
   * @throws {TypeError} if skipDomainVerification is invalid
   * @param {URLSearchParams} params
   * @private
   */
  _applySkipDomainVerification(params) {
    const val = this._config.skipDomainVerification;

    if (typeof val !== 'boolean') {
      throw new TypeError('"skipDomainVerification" must be a boolean');
    }

    params.append('skip_domain_verification', val ? 1 : 0);
  }

  /**
   * Validates and appends the whiteLabeling parameter to
   * the iFrame params object.
   *
   * @throws {TypeError} if whiteLabeling is invalid
   * @param {URLSearchParams} params
   * @private
   */
  _applyWhiteLabeling(params) {
    if ('whiteLabeling' in this._config) {
      const val = this._config.whiteLabeling;

      if (typeof val !== 'object') {
        throw new TypeError('"whiteLabeling" must be an object');
      }

      params.append('white_labeling_options', JSON.stringify(val));
    }
  }

  /**
   * Appends the version parameter to the iFrame params
   * object.
   *
   * @param {URLSearchParams} params
   * @private
   */
  _applyVersion(params) {
    params.append('js_version', __PKG_VERSION__);
  }

  /**
   * Validates and crates the iFrame params object.
   *
   * @param {URL} frameURL
   * @returns {URLSearchParams}
   * @private
   */
  _getFrameParams(frameURL) {
    const params = new URLSearchParams(frameURL.search);

    this._applyClientId(params);
    this._applyDebug(params);
    this._applyFinalButtonText(params);
    this._applyHideHeader(params);
    this._applyLocale(params);
    this._applyParentURL(params);
    this._applyRedirectTo(params);
    this._applyRequestingEmail(params);
    this._applySkipDomainVerification(params);
    this._applyVersion(params);
    this._applyWhiteLabeling(params);

    return params;
  }

  /**
   * Calculates and sets the iFrame frame src.
   *
   * @param {string} url
   * @private
   */
  _updateFrameUrl(url) {
    const frameURL = new URL(url);
    const frameParams = this._getFrameParams(frameURL);

    frameURL.search = frameParams.toString();

    this._iFrameURL = frameURL;
  }

  /**
   * Updates the type of embedded request base on the URL.
   *
   * @param {string} url
   * @returns {void}
   * @private
   */
  _updateEmbeddedType(url) {
    if (url.includes('embeddedSign')) {
      this._embeddedType = settings.types.EMBEDDED_SIGN;
    } else if (url.includes('embeddedTemplate')) {
      this._embeddedType = settings.types.EMBEDDED_TEMPLATE;
    } else if (url.includes('embeddedRequest')) {
      this._embeddedType = settings.types.EMBEDDED_REQUEST;
    } else {
      this._embeddedType = settings.types.UNKNOWN;
    }
  }

  /**
   * Returns a boolean indicating whether the close button
   * should be shown.
   *
   * @returns {boolean}
   * @private
   */
  _shouldShowCancelButton() {
    return this._config.allowCancel && this._embeddedType !== settings.types.EMBEDDED_SIGN;
  }

  /**
   * Renders the HelloSign Embedded markup.
   *
   * We would like to have used HTML Content Templates or
   * Range.createContextualFragment() but we are concerned
   * about browser support.
   *
   * @returns {HTMLElement}
   * @private
   */
  _renderMarkup() {
    const elem = document.createElement('div');

    if (this._config.container) {
      elem.innerHTML = safeHtml`
        <div class="${settings.classNames.BASE}">
          <iframe class="${settings.classNames.IFRAME}" name="${settings.iframe.NAME}" src="${this._iFrameURL.href}" />
        </div>
      `;
    } else {
      elem.innerHTML = safeHtml`
        <div class="${settings.classNames.BASE} ${settings.classNames.BASE_IN_MODAL}">
          <div class="${settings.classNames.MODAL_SCREEN}"></div>
          <div class="${settings.classNames.MODAL_CONTENT}">
      ` + (
        this._shouldShowCancelButton() ? safeHtml`
          <div class=${settings.classNames.MODAL_CLOSE}>
            <button class=${settings.classNames.MODAL_CLOSE_BTN} role="button" title="Close signature request"></button>
          </div>
        ` : ''
      ) + safeHtml`
            <iframe class="${settings.classNames.IFRAME}" name="${settings.iframe.NAME}" src="${this._iFrameURL.href}" />
          </div>
        </div>
      `;
    }

    return elem.firstChild;
  }

  /**
   * Renders the HelloSign Embedded markup into the DOM.
   *
   * @private
   */
  _appendMarkup() {
    this._baseEl = this._renderMarkup();

    // Listen for click events within the HelloSign
    // Embedded DOM markup. These will be delegated
    // depending on the source element.
    this._baseEl.addEventListener('click', this._onEmbeddedClick);

    // Obtain element references.
    this._iFrameEl = this._baseEl.getElementsByClassName(settings.classNames.IFRAME).item(0);

    // Insert HelloSign Embedded markup into the DOM.
    if (this._config.container) {
      this._config.container.appendChild(this._baseEl);
    } else {
      document.body.appendChild(this._baseEl);
    }
  }

  /**
   * Removes the HelloSign Embedded markup from the DOM.
   *
   *
   * @private
   */
  _clearMarkup() {
    this._baseEl.parentElement.removeChild(this._baseEl);
  }

  /**
   * @typedef {Object} HelloSignMessage
   * @property {string} type
   * @property {Object} [payload]
   */

  /**
   * Posts a cross-origin window message to the HelloSign
   * Embedded iFrame content window.
   *
   * @param {HelloSignMessage} msg
   * @private
   */
  _sendMessage(msg) {
    debug.info('posting message', msg);

    const targetOrigin = this._iFrameURL.href;
    const targetWindow = this._iFrameEl.contentWindow;

    targetWindow.postMessage(msg, targetOrigin);
  }

  /**
   * Sends the configuration message to the app.
   *
   * @private
   */
  _sendConfigurationMessage() {
    debug.info('sending app configuration message');

    this._sendMessage({
      type: settings.messages.APP_CONFIGURE,
      payload: {
        allowCancel: this._config.allowCancel,
      },
    });
  }

  /**
   * Sends the domain verification response.
   *
   * @param {string} token
   * @private
   */
  _sendDomainVerificationMessage(token) {
    debug.info('sending domain verification message', token);

    this._sendMessage({
      type: settings.messages.APP_VERIFY_DOMAIN_RESPONSE,
      payload: {
        token,
      },
    });
  }

  /**
   * Sends the initialization error message.
   *
   * @private
   */
  _sendInitializationErrorMessage() {
    debug.info('sending initialization error message');

    this._sendMessage({
      type: settings.messages.APP_ERROR,
      payload: {
        message: 'App failed to initialize before timeout',
      },
    });
  }

  /**
   * Clears the initialization timeout timer.
   *
   * @private
   */
  _clearInitTimeout() {
    if (this._initTimeout) {
      debug.info('clearing initialization timeout');

      clearTimeout(this._initTimeout);

      this._initTimeout = null;
    }
  }

  /**
   * Starts the initialization timeout timer.
   *
   * @private
   */
  _startInitTimeout() {
    if (this._embeddedType === settings.types.EMBEDDED_SIGN) {
      debug.info('starting initialization timeout');

      this._clearInitTimeout();

      this._initTimeout = setTimeout(this._onInitTimeout, this._config.timeout);
    }
  }

  /**
   * Starts the initialization timeout timer if this
   * embedded flow is for embedded signing.
   *
   * @private
   */
  _maybeStartInitTimeout() {
    if (this._embeddedType === settings.types.EMBEDDED_SIGN) {
      this._startInitTimeout();
    }
  }

  /**
   * @event HelloSign#error
   * @type {Object}
   * @property {string} signatureId
   * @property {number} code
   */

  /**
   * Called when the app encountered an error.
   *
   * @emits HelloSign#error
   * @param {Object} payload
   * @private
   */
  _appDidError(payload) {
    debug.error('app encountered an error with code:', payload.code);

    this.emit(settings.events.ERROR, payload);
  }

  /**
   * @event HelloSign#initialize
   * @type {Object}
   * @property {string} signatureId
   */

  /**
   * Called when the app was initialized.
   *
   * @emits HelloSign#initialize
   * @param {Object} payload
   * @private
   */
  _appDidInitialize(payload) {
    debug.info('app was initialized');

    this.emit(settings.events.INITIALIZE, payload);

    this._sendConfigurationMessage();
    this._clearInitTimeout();
  }

  /**
   * Called when the app requested domain verification.
   *
   * @param {Object} payload
   * @param {string} payload.token
   * @private
   */
  _appDidRequestDomainVerification({ token }) {
    debug.info('app requested domain verification', token);

    this._sendDomainVerificationMessage(token);
  }

  /**
   * @event HelloSign#message
   * @type {Object}
   * @property {string} type
   * @property {?Object} payload
   */

  /**
   * Called when HelloSign Embedded receives a cross-origin
   * window message.
   *
   * @emits HelloSign#message
   * @param {MessageEvent} evt
   * @private
   */
  _appDidSendMessage({ data, origin }) {
    debug.info('received message', data, origin);

    this.emit(settings.events.MESSAGE, data);

    this._delegateMessage(data);
  }

  /**
   * Called when the user closed the request.
   *
   * @param {Object} payload
   * @private
   */
  _userDidCloseRequest() {
    debug.info('user requested that the window be closed');

    this.close();
  }

  /**
   * @event HelloSign#createTemplate
   * @type {Object}
   * @property {string} title
   * @property {string} message
   * @property {string[]} signerRoles
   * @property {Object} signatureRequestInfo
   */

  /**
   * Called when the user created the template.
   *
   * @emits HelloSign#createTemplate
   * @param {Object} payload
   * @private
   */
  _userDidCreateTemplate(payload) {
    debug.info('user created the signature request template');

    this.emit(settings.events.CREATE_TEMPLATE, payload);
  }

  /**
   * @event HelloSign#decline
   * @type {Object}
   * @property {string} signatureId
   * @property {string} reason
   */

  /**
   * Called when the user declined the request.
   *
   * @emits HelloSign#decline
   * @param {Object} payload
   * @private
   */
  _userDidDeclineRequest(payload) {
    debug.info('user declined the signature request');

    this.emit(settings.events.DECLINE, payload);
  }

  /**
   * @event HelloSign#reassign
   * @type {Object}
   * @property {string} signatureId
   * @property {string} name
   * @property {string} email
   * @property {string} reason
   */

  /**
   * Called when the user reassigned the request.
   *
   * @emits HelloSign#reassign
   * @param {Object} payload
   * @private
   */
  _userDidReassignRequest(payload) {
    debug.info('user reassigned the signature request with reason:', payload.reason);

    this.emit(settings.events.REASSIGN, payload);
  }

  /**
   * @event HelloSign#send
   * @type {Object}
   * @property {string} signatureRequestId
   * @property {string} signatureId
   */

  /**
   * Called when the user sent the request.
   *
   * @emits HelloSign#send
   * @param {Object} payload
   * @private
   */
  _userDidSendRequest(payload) {
    debug.info('user sent the signature request');

    this.emit(settings.events.SEND, payload);
  }

  /**
   * @event HelloSign#sign
   * @type {Object}
   * @property {string} signatureId
   */

  /**
   * Called when the user signed the request.
   *
   * @emits HelloSign#sign
   * @param {Object} payload
   * @private
   */
  _userDidSignRequest(payload) {
    debug.info('user signed the signature request');

    this.emit(settings.events.SIGN, payload);
  }

  /**
   * Called when the user clicks anything within the
   * HelloSign Embedded boundary.
   *
   * @param {Event} evt
   * @private
   */
  _onEmbeddedClick(evt) {
    const elem = evt.srcElement;

    // Check if the element that was clicked is the close
    // button.
    if (elem.classList.contains(settings.classNames.MODAL_CLOSE_BTN)) {
      evt.preventDefault();

      this.close();
    }
  }

  /**
   * Called when the initialization timeout timer completes.
   * Sends an error message to the app and closes HelloSign
   * Embedded.
   *
   * @private
   */
  _onInitTimeout() {
    debug.error('app failed to initialize before timeout');

    // Display error to the user instead of just closing the
    // signature request window.
    // eslint-disable-next-line no-alert
    alert('Something went wrong when preparing your signature request. Please try again.');

    this._sendInitializationErrorMessage();
    this._clearInitTimeout();

    this.close();
  }

  /**
   * Called when a message is received by the window.
   * Validates the message origin and delegates to the
   * appropriate method based on the message type.
   *
   * @param {MessageEvent} evt
   * @private
   */
  _onMessage(message) {
    if (message.origin === this._iFrameURL.origin) {
      if (typeof message.data === 'object') {
        this._appDidSendMessage(message);
      }
    }
  }

  /**
   * Called when a message is received by the window.
   * Validates the message origin and delegates to the
   * appropriate method based on the message type.
   *
   * @param {HelloSignMessage} msg
   * @private
   */
  _delegateMessage({ type, payload }) {
    switch (type) {
      case settings.messages.APP_ERROR: {
        this._appDidError(payload);
        break;
      }
      case settings.messages.APP_INITIALIZE: {
        this._appDidInitialize(payload);
        break;
      }
      case settings.messages.APP_VERIFY_DOMAIN_REQUEST: {
        this._appDidRequestDomainVerification(payload);
        break;
      }
      case settings.messages.USER_CLOSE_REQUEST: {
        this._userDidCloseRequest(payload);
        break;
      }
      case settings.messages.USER_CREATE_TEMPLATE: {
        this._userDidCreateTemplate(payload);
        break;
      }
      case settings.messages.USER_DECLINE_REQUEST: {
        this._userDidDeclineRequest(payload);
        break;
      }
      case settings.messages.USER_REASSIGN_REQUEST: {
        this._userDidReassignRequest(payload);
        break;
      }
      case settings.messages.USER_SEND_REQUEST: {
        this._userDidSendRequest(payload);
        break;
      }
      case settings.messages.USER_SIGN_REQUEST: {
        this._userDidSignRequest(payload);
        break;
      }
      default: {
        // Unhandled message.
        debug.warn('unhandled cross-origin window message');
      }
    }
  }

  /**
   * @event HelloSign#open
   * @type {Object}
   * @property {string} url
   * @property {string} iFrameUrl
   */

  /**
   * @typedef {Object} HelloSignOptions
   * @property {boolean} [allowCancel=true]
   * @property {string} [clientId]
   * @property {HTMLElement} [container]
   * @property {boolean} [debug=false]
   * @property {boolean} [hideHeader=false]
   * @property {string} [locale="en_US"]
   * @property {string} [redirectTo]
   * @property {string} [requestingEmail]
   * @property {boolean} [skipDomainVerification=false]
   * @property {number} [timeout=30000]
   * @property {Object} [whiteLabeling]
   */

  /**
   * Opens the url in HelloSign Embedded.
   *
   * @emits HelloSign#open
   * @param {string} url
   * @param {HelloSignOptions} [opts={}]
   * @public
   */
  open(url, opts = {}) {
    debug.info('open()', url, opts);

    // Close if embedded is already open.
    if (this._isOpen) {
      this.close();
    }

    this._config = {
      ...defaults,
      ...this._baseConfig,
      ...opts,
    };

    // Check if container is valid.
    if (this._config.container) {
      if (!(this._config.container instanceof HTMLElement)) {
        throw new TypeError('"container" must be an element');
      }
    }

    this._updateFrameUrl(url);
    this._updateEmbeddedType(url);
    this._appendMarkup();
    this._maybeStartInitTimeout();

    this._isOpen = true;

    window.addEventListener('message', this._onMessage);

    this.emit(settings.events.OPEN, {
      iFrameUrl: this._iFrameURL.href,
      url,
    });
  }

  /**
   * @event HelloSign#close
   */

  /**
   * Closes the HelloSign Embeded window.
   *
   * @emits HelloSign#close
   * @public
   */
  close() {
    debug.info('close()');

    // It's already closed!
    if (!this._isOpen) {
      return;
    }

    this._clearInitTimeout();
    this._clearMarkup();

    this._baseEl.removeEventListener('click', this._onEmbeddedClick);

    this._config = null;
    this._baseEl = null;
    this._embeddedType = null;
    this._iFrameEl = null;
    this._iFrameURL = null;
    this._isOpen = false;

    window.removeEventListener('message', this._onMessage);

    this.emit(settings.events.CLOSE);
  }

  /**
   * Overrides tiny-emitter's "emit" method.
   *
   * @see https://www.npmjs.com/package/tiny-emitter
   * @param {string} name
   * @param {any} [data]
   * @override
   */
  emit(...args) {
    debug.info('emit()', ...args);

    super.emit(...args);
  }

  /**
   * @returns {?HTMLElement}
   * @public
   */
  get element() {
    return this._baseEl;
  }

  /**
   * @returns {boolean}
   * @public
   */
  get isOpen() {
    return this._isOpen;
  }
}

export default HelloSign;
