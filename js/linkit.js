/**
 * @file
 * Linkit dialog functions.
 */

(function ($) {

// Create the Linkit namespaces.
Backdrop.linkit = Backdrop.linkit || { 'excludeIdSelectors': {} };
Backdrop.linkit.currentInstance = Backdrop.linkit.currentInstance || {};
Backdrop.linkit.dialogHelper = Backdrop.linkit.dialogHelper || {};
Backdrop.linkit.insertPlugins = Backdrop.linkit.insertPlugins || {};

// Exclude ids from ajax_html_ids during AJAX requests.
Backdrop.linkit.excludeIdSelectors.ckeditor = ['[id^="cke_"]'];
Backdrop.linkit.excludeIdSelectors.tokens = ['[id^="token-"]'];

/**
 * Create the modal dialog.
 */
Backdrop.linkit.createModal = function() {
  // Create the modal dialog element.
  Backdrop.linkit.createModalElement()
  // Create jQuery UI Dialog.
  .dialog(Backdrop.linkit.modalOptions())
  // Remove the title bar from the modal.
  .siblings(".ui-dialog-titlebar").hide();

  // Make the modal seem "fixed".
  $(window).bind("scroll resize", function() {
    $('#linkit-modal').dialog('option', 'position', ['center', 50]);
  });

  // Get modal content.
  Backdrop.linkit.getDashboard();
};

/**
 * Create and append the modal element.
 */
Backdrop.linkit.createModalElement = function() {
  // Create a new div and give it an ID of linkit-modal.
  // This is the dashboard container.
  var linkitModal = $('<div id="linkit-modal"></div>');

  // Create a modal div in the <body>.
  $('body').append(linkitModal);

  return linkitModal;
};

/**
 * Default jQuery dialog options used when creating the Linkit modal.
 */
Backdrop.linkit.modalOptions = function() {
  return {
    dialogClass: 'linkit-wrapper',
    modal: true,
    draggable: false,
    resizable: false,
    width: 520,
    position: ['center', 50],
    minHeight: 0,
    zIndex: 210000,
    close: Backdrop.linkit.modalClose,
    open: function (event, ui) {
      // Change the overlay style.
      $('.ui-widget-overlay').css({
        opacity: 0.5,
        filter: 'Alpha(Opacity=50)',
        backgroundColor: '#FFFFFF'
      });
    },
    title: 'Linkit'
  };
};

/**
 * Close the Linkit modal.
 */
Backdrop.linkit.modalClose = function (e) {
  $('#linkit-modal').dialog('destroy').remove();

  // Run the onModalClose() function.
  var helper_name = Backdrop.settings.linkit.currentInstance.helper,
      helper = Backdrop.linkit.getDialogHelper(helper_name);
  if (typeof helper.onModalClose === 'function') {
    helper.onModalClose();
  }

  // Make sure the current intstance settings are removed when the modal is
  // closed.
  Backdrop.settings.linkit.currentInstance = {};

  // The event object does not have a preventDefault member in
  // Internet Explorer prior to version 9.
  if (e && e.preventDefault) {
    e.preventDefault();
  }
  else {
    return false;
  }
};

/**
 *
 */
Backdrop.linkit.getDashboard = function () {
  // Create the AJAX object.
  var ajax_settings = {};
  ajax_settings.event = 'LinkitDashboard';
  ajax_settings.url = Backdrop.settings.linkit.dashboardPath +  Backdrop.settings.linkit.currentInstance.profile;
  ajax_settings.progress = {
    type: 'throbber',
    message : Backdrop.t('Loading Linkit dashboard...')
  };

  Backdrop.ajax['linkit-modal'] = new Backdrop.ajax('linkit-modal', $('#linkit-modal')[0], ajax_settings);

  // @TODO: Jquery 1.5 accept success setting to be an array of functions.
  // But we have to wait for jquery to get updated in Backdrop core.
  // In the meantime we have to override it.
  Backdrop.ajax['linkit-modal'].options.success = function (response, status) {
    if (typeof response == 'string') {
      response = $.parseJSON(response);
    }

    // Call the ajax success method.
    Backdrop.ajax['linkit-modal'].success(response, status);
    // Run the afterInit function.
    var helper = Backdrop.settings.linkit.currentInstance.helper;
    Backdrop.linkit.getDialogHelper(helper).afterInit();

    // Set focus in the search field.
    $('#linkit-modal .linkit-search-element').focus();
  };

  // Update the autocomplete url.
  Backdrop.settings.linkit.currentInstance.autocompletePathParsed =
    Backdrop.settings.linkit.autocompletePath.replace('___profile___',  Backdrop.settings.linkit.currentInstance.profile);

  // Trigger the ajax event.
  $('#linkit-modal').trigger('LinkitDashboard');
};

/**
 * Register new dialog helper.
 */
Backdrop.linkit.registerDialogHelper = function(name, helper) {
  Backdrop.linkit.dialogHelper[name] = helper;
};

/**
 * Get a dialog helper.
 *
 * @param {String} name
 *   The name of helper.
 *
 * @return {Object}
 *   Dialog helper object.
 */
Backdrop.linkit.getDialogHelper = function(name) {
  return Backdrop.linkit.dialogHelper[name];
};

/**
 * Register new insert plugins.
 */
Backdrop.linkit.registerInsertPlugin = function(name, plugin) {
  Backdrop.linkit.insertPlugins[name] = plugin;
};

/**
 * Get an insert plugin.
 */
Backdrop.linkit.getInsertPlugin = function(name) {
  return Backdrop.linkit.insertPlugins[name];
};

var oldBeforeSerialize = (Backdrop.ajax ? Backdrop.ajax.prototype.beforeSerialize : false);
if (oldBeforeSerialize) {
  /**
   * Filter the ajax_html_ids list sent in AJAX requests.
   *
   * This avoids hitting like max_input_vars, which defaults to 1000,
   * even with just a few active editor instances.
   */
  Backdrop.ajax.prototype.beforeSerialize = function (element, options) {
    var ret = oldBeforeSerialize.call(this, element, options);
    var excludeSelectors = [];
    $.each(Backdrop.linkit.excludeIdSelectors, function () {
      if ($.isArray(this)) {
        excludeSelectors = excludeSelectors.concat(this);
      }
    });
    if (excludeSelectors.length > 0) {
      options.data['ajax_html_ids[]'] = [];
      $('[id]:not(' + excludeSelectors.join(',') + ')').each(function () {
        options.data['ajax_html_ids[]'].push(this.id);
      });
    }
    return ret;
  }
}

})(jQuery);
