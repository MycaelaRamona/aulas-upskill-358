/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

(function ($, Drupal, document) {
  if (Drupal.filterConfiguration) {
    Drupal.filterConfiguration.liveSettingParsers.filter_html = {
      getRules: function getRules() {
        var currentValue = document.querySelector('#edit-filters-filter-html-settings-allowed-html').value;

        var rules = Drupal.behaviors.filterFilterHtmlUpdating._parseSetting(currentValue);

        var rule = new Drupal.FilterHTMLRule();
        rule.restrictedTags.tags = ['*'];
        rule.restrictedTags.forbidden.attributes = ['style', 'on*'];
        rules.push(rule);
        return rules;
      }
    };
  }

  function difference() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return args.reduce(function (mainData, otherData) {
      return mainData.filter(function (data) {
        return !otherData.includes(data);
      });
    });
  }

  Drupal.behaviors.filterFilterHtmlUpdating = {
    $allowedHTMLFormItem: null,
    $allowedHTMLDescription: null,
    userTags: {},
    autoTags: null,
    newFeatures: {},
    attach: function attach(context, settings) {
      var that = this;
      once('filter-filter_html-updating', '[name="filters[filter_html][settings][allowed_html]"]', context).forEach(function (formItem) {
        that.$allowedHTMLFormItem = $(formItem);
        that.$allowedHTMLDescription = that.$allowedHTMLFormItem.closest('.js-form-item').find('#edit-filters-filter-html-settings-allowed-html--description');
        that.userTags = that._parseSetting(formItem.value);
        $(document).on('drupalEditorFeatureAdded', function (e, feature) {
          that.newFeatures[feature.name] = feature.rules;

          that._updateAllowedTags();
        }).on('drupalEditorFeatureModified', function (e, feature) {
          if (that.newFeatures.hasOwnProperty(feature.name)) {
            that.newFeatures[feature.name] = feature.rules;

            that._updateAllowedTags();
          }
        }).on('drupalEditorFeatureRemoved', function (e, feature) {
          if (that.newFeatures.hasOwnProperty(feature.name)) {
            delete that.newFeatures[feature.name];

            that._updateAllowedTags();
          }
        });
        that.$allowedHTMLFormItem.on('change.updateUserTags', function () {
          that.userTags = difference(Object.values(that._parseSetting(this.value)), Object.values(that.autoTags));
        });
      });
    },
    _updateAllowedTags: function _updateAllowedTags() {
      var _this = this;

      this.autoTags = this._calculateAutoAllowedTags(this.userTags, this.newFeatures);
      this.$allowedHTMLDescription.find('.editor-update-message').remove();

      if (Object.keys(this.autoTags).length > 0) {
        this.$allowedHTMLDescription.append(Drupal.theme('filterFilterHTMLUpdateMessage', this.autoTags));
        var userTagsWithoutOverrides = {};
        Object.keys(this.userTags).filter(function (tag) {
          return !_this.autoTags.hasOwnProperty(tag);
        }).forEach(function (tag) {
          userTagsWithoutOverrides[tag] = _this.userTags[tag];
        });
        this.$allowedHTMLFormItem.val("".concat(this._generateSetting(userTagsWithoutOverrides), " ").concat(this._generateSetting(this.autoTags)));
      } else {
        this.$allowedHTMLFormItem.val(this._generateSetting(this.userTags));
      }
    },
    _calculateAutoAllowedTags: function _calculateAutoAllowedTags(userAllowedTags, newFeatures) {
      var editorRequiredTags = {};
      Object.keys(newFeatures || {}).forEach(function (featureName) {
        var feature = newFeatures[featureName];
        var featureRule;
        var filterRule;
        var tag;

        for (var f = 0; f < feature.length; f++) {
          featureRule = feature[f];

          for (var t = 0; t < featureRule.required.tags.length; t++) {
            tag = featureRule.required.tags[t];

            if (!editorRequiredTags.hasOwnProperty(tag)) {
              filterRule = new Drupal.FilterHTMLRule();
              filterRule.restrictedTags.tags = [tag];
              filterRule.restrictedTags.allowed.attributes = featureRule.required.attributes.slice(0);

              if (userAllowedTags[tag] !== undefined && userAllowedTags[tag].restrictedTags.allowed.classes[0] !== '') {
                filterRule.restrictedTags.allowed.classes = featureRule.required.classes.slice(0);
              }

              editorRequiredTags[tag] = filterRule;
            } else {
              filterRule = editorRequiredTags[tag];
              filterRule.restrictedTags.allowed.attributes = [].concat(_toConsumableArray(filterRule.restrictedTags.allowed.attributes), _toConsumableArray(featureRule.required.attributes));

              if (userAllowedTags[tag] !== undefined && userAllowedTags[tag].restrictedTags.allowed.classes[0] !== '') {
                filterRule.restrictedTags.allowed.classes = [].concat(_toConsumableArray(filterRule.restrictedTags.allowed.classes), _toConsumableArray(featureRule.required.classes));
              }
            }
          }
        }
      });
      var autoAllowedTags = {};
      Object.keys(editorRequiredTags).forEach(function (tag) {
        if (!userAllowedTags.hasOwnProperty(tag)) {
          autoAllowedTags[tag] = editorRequiredTags[tag];
        } else {
          var requiredAttributes = editorRequiredTags[tag].restrictedTags.allowed.attributes;
          var allowedAttributes = userAllowedTags[tag].restrictedTags.allowed.attributes;
          var needsAdditionalAttributes = requiredAttributes.length && difference(requiredAttributes, allowedAttributes).length;
          var requiredClasses = editorRequiredTags[tag].restrictedTags.allowed.classes;
          var allowedClasses = userAllowedTags[tag].restrictedTags.allowed.classes;
          var needsAdditionalClasses = requiredClasses.length && difference(requiredClasses, allowedClasses).length;

          if (needsAdditionalAttributes || needsAdditionalClasses) {
            autoAllowedTags[tag] = userAllowedTags[tag].clone();
          }

          if (needsAdditionalAttributes) {
            autoAllowedTags[tag].restrictedTags.allowed.attributes = [].concat(_toConsumableArray(allowedAttributes), _toConsumableArray(requiredAttributes));
          }

          if (needsAdditionalClasses) {
            autoAllowedTags[tag].restrictedTags.allowed.classes = [].concat(_toConsumableArray(allowedClasses), _toConsumableArray(requiredClasses));
          }
        }
      });
      return autoAllowedTags;
    },
    _parseSetting: function _parseSetting(setting) {
      var tag;
      var rule;
      var attributes;
      var attribute;
      var allowedTags = setting.match(/(<[^>]+>)/g);
      var rules = {};

      for (var t = 0; t < allowedTags.length; t++) {
        var $tagObject = $(allowedTags[t]);
        tag = $tagObject.prop('tagName').toLowerCase();
        rule = new Drupal.FilterHTMLRule();
        rule.restrictedTags.tags = [tag];
        attributes = $tagObject.prop('attributes');

        for (var i = 0; i < attributes.length; i++) {
          attribute = attributes.item(i);
          var attributeName = attribute.nodeName;

          if (attributeName === 'class') {
            var attributeValue = attribute.textContent;
            rule.restrictedTags.allowed.classes = attributeValue.split(' ');
          } else {
            rule.restrictedTags.allowed.attributes.push(attributeName);
          }
        }

        rules[tag] = rule;
      }

      return rules;
    },
    _generateSetting: function _generateSetting(tags) {
      return Object.keys(tags).reduce(function (setting, tag) {
        var rule = tags[tag];
        var allowedClasses = rule.restrictedTags.allowed.classes;

        if (setting.length) {
          setting += ' ';
        }

        setting += "<".concat(tag);

        if (rule.restrictedTags.allowed.attributes.length) {
          setting += " ".concat(rule.restrictedTags.allowed.attributes.join(' '));
        }

        if (allowedClasses.length === 1 && allowedClasses[0] === '') {
          setting += ' class';
        } else if (allowedClasses.length) {
          setting += " class=\"".concat(allowedClasses.join(' '), "\"");
        }

        setting += '>';
        return setting;
      }, '');
    }
  };

  Drupal.theme.filterFilterHTMLUpdateMessage = function (tags) {
    var html = '';

    var tagList = Drupal.behaviors.filterFilterHtmlUpdating._generateSetting(tags);

    html += '<p class="editor-update-message">';
    html += Drupal.t('Based on the text editor configuration, these tags have automatically been added: <strong>@tag-list</strong>.', {
      '@tag-list': tagList
    });
    html += '</p>';
    return html;
  };
})(jQuery, Drupal, document);