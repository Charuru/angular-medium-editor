'use strict';

angular.module('angular-medium-editor', [])

.directive('mediumEditor', function() {
  return {
    require: 'ngModel',
    restrict: 'AE',
    scope: {
      bindOptions: '='
    },
    link: function(scope, iElement, iAttrs, ctrl) {


      function inlineLinkAudio() {
        this.button = document.createElement('button');
        this.button.className = 'medium-editor-action fa-music fa';
        this.button.innerText = ' ';
        this.button.onclick = this.onClick.bind(this);
      }

      inlineLinkAudio.prototype.onClick = function() {
        var applier = this.classApplier;

        ty.filepicker.init()
        analytics.track('Audio select')
        filepicker.pickAndStore({
          extensions: ['.mp3', '.wav'],
          services: ['COMPUTER', 'URL'],
          maxSize: 15 * 1000 * 1024
        }, {
          location: 'S3'
        }, function(FPFiles) {
          var url = FPFiles[0].url
          applier = rangy.createCssClassApplier('tydai-inlineLinkAudio', {
            normalize: true,
            ignoreWhiteSpace: true,
            elementTagName: "a",
            elementAttributes: {
              'data-url': url
            }
          });
          applier.toggleSelection();
        });
      };

      inlineLinkAudio.prototype.getButton = function() {
        return this.button;
      };
      inlineLinkAudio.prototype.checkState = function(node) {
        if (node.classList.contains('tydai-inlineLinkAudio')) {          
          this.button.classList.add('medium-editor-button-active');
        }
      };



      var defaultOptions;

      ty.scripts.get('editor', function() {
        rangy.init();
        defaultOptions = {
          buttons: ["bold", "italic", "underline", "strikethrough", "header1", "header2", "header3", "header4", "quote", "unorderedlist", 'inlineLinkAudio'],
          extensions: {
            inlineLinkAudio: new inlineLinkAudio()
          }
        }
      })


      angular.element(iElement).addClass('angular-medium-editor');

      // Parse options
      var opts = {},
        placeholder = '';
      var prepOpts = function() {
        if (iAttrs.options) {
          opts = scope.$eval(iAttrs.options);
        }
        var bindOpts = {};
        if (scope.bindOptions !== undefined) {
          bindOpts = scope.bindOptions;
        }
        opts = angular.extend(opts, bindOpts);
        opts = angular.extend(opts, defaultOptions);
      };
      placeholder = opts.placeholder;
      scope.$watch('bindOptions', function() {
        // in case options are provided after mediumEditor directive has been compiled and linked (and after $render function executed)
        // we need to re-initialize
        if (ctrl.editor) {
          ctrl.editor.deactivate();
        }
        // Hide placeholder when the model is not empty
        if (!ctrl.$isEmpty(ctrl.$viewValue)) {
          opts.placeholder = '';
        }
        ty.scripts.get('editor', function() {
          prepOpts();
          ctrl.editor = new MediumEditor(iElement, opts);
        })

      });

      var onChange = function() {

        scope.$apply(function() {

          // If user cleared the whole text, we have to reset the editor because MediumEditor
          // lacks an API method to alter placeholder after initialization
          if (iElement.html() === '<p><br></p>' || iElement.html() === '') {
            opts.placeholder = placeholder;
            var editor;
            ty.scripts.get('editor', function() {
              editor = new MediumEditor(iElement, opts);
            })
          }

          if (ctrl.$viewValue != iElement.html()) {
            ctrl.$setViewValue(iElement.html());
            scope.$emit('editChanged', iElement)
          }
        });
      };

      // view -> model
      // iElement.on('blur', onChange);
      iElement.on('input', onChange);

      // model -> view
      ctrl.$render = function() {

        if (!this.editor) {
          // Hide placeholder when the model is not empty
          if (!ctrl.$isEmpty(ctrl.$viewValue)) {
            opts.placeholder = '';
          }
          var self = this
          ty.scripts.get('editor', function() {
            prepOpts();
            self.editor = new MediumEditor(iElement, opts);
          })
        }

        iElement.html(ctrl.$isEmpty(ctrl.$viewValue) ? '' : ctrl.$viewValue);

        // hide placeholder when view is not empty
        if (!ctrl.$isEmpty(ctrl.$viewValue)) angular.element(iElement).removeClass('medium-editor-placeholder');
      };

    }
  };

});
