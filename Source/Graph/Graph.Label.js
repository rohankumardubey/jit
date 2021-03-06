/*
 * File: Graph.Label.js
 *
*/

/*
   Object: Graph.Label

   An interface for plotting/hiding/showing labels.

   Description:

   This is a generic interface for plotting/hiding/showing labels.
   The <Graph.Label> interface is implemented in multiple ways to provide
   different label types.

   For example, the Graph.Label interface is implemented as <Graph.Label.HTML> to provide
   HTML label elements. Also we provide the <Graph.Label.SVG> interface for SVG type labels. 
   The <Graph.Label.Native> interface implements these methods with the native Canvas text rendering functions.
   
   All subclasses (<Graph.Label.HTML>, <Graph.Label.SVG> and <Graph.Label.Native>) implement the method plotLabel.
*/

Graph.Label = {};

/*
   Class: Graph.Label.Native

   Implements labels natively, using the Canvas text API.
*/
Graph.Label.Native = new Class({
    //prepare a label for an animation.
    prepareForAnimation: $.empty,
    
    /*
       Method: plotLabel

       Plots a label for a given node.

       Parameters:

       canvas - (object) A <Canvas> instance.
       node - (object) A <Graph.Node>.
       controller - (object) A configuration object.
       
       Example:
       
       (start code js)
       var viz = new $jit.Viz(options);
       var node = viz.graph.getNode('nodeId');
       viz.labels.plotLabel(viz.canvas, node, viz.config);
       (end code)
    */
    plotLabel: function(canvas, node, controller) {
      var ctx = canvas.getCtx();
      var pos = node.pos.getc(true);

      ctx.font = node.getLabelData('style') + ' ' + node.getLabelData('size') + 'px ' + node.getLabelData('family');
      ctx.textAlign = node.getLabelData('textAlign');
      ctx.fillStyle = ctx.strokeStyle = node.getLabelData('color');
      ctx.textBaseline = node.getLabelData('textBaseline');

      this.renderLabel(canvas, node, controller);
    },

    /*
       renderLabel

       Does the actual rendering of the label in the canvas. The default
       implementation renders the label close to the position of the node, this
       method should be overriden to position the labels differently.

       Parameters:

       canvas - A <Canvas> instance.
       node - A <Graph.Node>.
       controller - A configuration object. See also <Hypertree>, <RGraph>, <ST>.
    */
    renderLabel: function(canvas, node, controller) {
      var ctx = canvas.getCtx();
      var pos = node.pos.getc(true);
      ctx.fillText(node.name, pos.x, pos.y + node.getData("height") / 2);
    },

    hideLabel: $.empty,
    hideLabels: $.empty
});

/*
   Class: Graph.Label.DOM

   Abstract Class implementing some DOM label methods.

   Implemented by:

   <Graph.Label.HTML> and <Graph.Label.SVG>.

*/
Graph.Label.DOM = new Class({
    //A flag value indicating if node labels are being displayed or not.
    labelsHidden: false,
    //Label container
    labelContainer: false,
    //Label elements hash.
    labels: {},
    //For preparing animations
    prepareForAnimation: $.empty,

    /*
       Method: getLabelContainer

       Lazy fetcher for the label container.

       Returns:

       The label container DOM element.

       Example:

      (start code js)
        var viz = new $jit.Viz(options);
        var labelContainer = viz.labels.getLabelContainer();
        alert(labelContainer.innerHTML);
      (end code)
    */
    getLabelContainer: function() {
      return this.labelContainer ?
        this.labelContainer :
        this.labelContainer = document.getElementById(this.viz.config.labelContainer);
    },

    /*
       Method: getLabel

       Lazy fetcher for the label element.

       Parameters:

       id - (string) The label id (which is also a <Graph.Node> id).

       Returns:

       The label element.

       Example:

      (start code js)
        var viz = new $jit.Viz(options);
        var label = viz.labels.getLabel('someid');
        alert(label.innerHTML);
      (end code)

    */
    getLabel: function(id) {
      return (id in this.labels && this.labels[id] != null) ?
        this.labels[id] :
        this.labels[id] = document.getElementById(id);
    },
    
    /*
      Method: plotLabel
  
      Plots a label for a given node.
  
      Parameters:
  
      canvas - (object) A <Canvas> instance.
      node - (object) A <Graph.Node>.
      controller - (object) A configuration object.
      
     Example:
      
      (start code js)
      var viz = new $jit.Viz(options);
      var node = viz.graph.getNode('nodeId');
      viz.labels.plotLabel(viz.canvas, node, viz.config);
      (end code)
  
  
   */
   plotLabel: function(canvas, node, controller) {
     var id = node.id, tag = this.getOrCreateLabel(node);
     this.placeLabel(tag, node, controller);
   },

    /*
       Method: hideLabels

       Hides all labels (by hiding the label container).

       Parameters:

       hide - (boolean) A boolean value indicating if the label container must be hidden or not.

       Example:
       (start code js)
        var viz = new $jit.Viz(options);
        rg.labels.hideLabels(true);
       (end code)

    */
    hideLabels: function (hide) {
      var container = this.getLabelContainer();
      if(hide)
        container.style.display = 'none';
      else
        container.style.display = '';
      this.labelsHidden = hide;
    },

    /*
       Method: clearLabels

       Clears the label container.

       Useful when using a new visualization with the same canvas element/widget.

       Parameters:

       force - (boolean) Forces deletion of all labels.

       Example:
       (start code js)
        var viz = new $jit.Viz(options);
        viz.labels.clearLabels();
        (end code)
    */
    clearLabels: function(force) {
      for(var id in this.labels) {
        if (force || !this.viz.graph.hasNode(id)) {
          this.disposeLabel(id);
          delete this.labels[id];
        }
      }
    },

    /*
       Method: disposeLabel

       Removes a label.

       Parameters:

       id - (string) A label id (which generally is also a <Graph.Node> id).

       Example:
       (start code js)
        var viz = new $jit.Viz(options);
        viz.labels.disposeLabel('labelid');
       (end code)
    */
    disposeLabel: function(id) {
      var elem = this.getLabel(id);
      if(elem && elem.parentNode) {
        elem.parentNode.removeChild(elem);
      }
    },

    /*
       Method: hideLabel

       Hides the corresponding <Graph.Node> label.

       Parameters:

       node - (object) A <Graph.Node>. Can also be an array of <Graph.Nodes>.
       show - (boolean) If *true*, nodes will be shown. Otherwise nodes will be hidden.

       Example:
       (start code js)
        var rg = new $jit.Viz(options);
        viz.labels.hideLabel(viz.graph.getNode('someid'), false);
       (end code)
    */
    hideLabel: function(node, show) {
      node = $.splat(node);
      var st = show ? "" : "none", lab, that = this;
      $.each(node, function(n) {
        lab = that.getLabel(n.id);
        if (lab) {
          lab.style.display = st;
        }
      });
    },

    /*
       fitsInCanvas

       Returns _true_ or _false_ if the label for the node is contained in the canvas dom element or not.

       Parameters:

       pos - A <Complex> instance (I'm doing duck typing here so any object with _x_ and _y_ parameters will do).
       canvas - A <Canvas> instance.

       Returns:

       A boolean value specifying if the label is contained in the <Canvas> DOM element or not.

    */
    fitsInCanvas: function(pos, canvas) {
      var size = canvas.getSize();
      if(pos.x >= size.width || pos.x < 0
         || pos.y >= size.height || pos.y < 0) return false;
       return true;
    }
});

/*
   Class: Graph.Label.HTML

   Implements HTML labels.

   Extends:

   All <Graph.Label.DOM> methods.

*/
Graph.Label.HTML = new Class({
    Implements: Graph.Label.DOM,

    css3Props: ['width', 'height', 'top', 'left', 'color', 'opacity'],

    prefixes: ['webkit', 'moz', 'o', ''],
    
    prefixesStyles: ['-webkit-', '-moz-', '-o-', ''],
    
    prepareForAnimation: function(node, modes, opt) {
      if (!this.viz.config.Label.useCSS3) return;
      var css3Props = this.css3Props,
          canvas = this.viz.canvas,
          size = canvas.getSize(),
          nodeProps = modes['node-property'] || [],
          pos = node.getPos('end').getc(true),
          posStart = node.getPos('start').getc(true),
          startWidth = node.getData('width', 'start'),
          startHeight = node.getData('height', 'start'),
          endWidth = node.getData('width', 'end'),
          endHeight = node.getData('height', 'end'),
          alpha = node.getData('alpha'),
          alphaEnd = node.getData('alpha', 'end');

        var label = this.getOrCreateLabel(node),
            style = label.style,
            pref = this.prefixes;
        
        //animating alpha
        if (alpha != alphaEnd) {
          style.visibility = 'visible';
          style.opacity = String(alpha);
          //set properties
          $.each(this.prefixesStyles, function(p) {
            style[p + 'transition-property'] = 'opacity';
            //TODO(nico) add transition
            style[p + 'transition-duration'] = opt.duration + 'ms';
            style[p + 'transition-delay'] = '200ms';
            style[p + 'transition-timing-function'] = 'ease-in-out';
          });
          style.opacity = String(alphaEnd);
          var wte = function() {
            $.each(pref, function(p) {
              label.removeEventListener(p + 'TransitionEnd', wte);
              style.visibility = 'hidden';
            });
          };
          if (alphaEnd == 0 && alpha == 1) {
            $.each(pref, function(p) {
              label.addEventListener(p + 'TransitionEnd', wte, false);
            });
          }
          //changing the position or dimensions...
        } else if (pos.x != posStart.x || pos.y != posStart.y || startWidth != endWidth || startHeight != endHeight) {
          //set label transition properties.
          $.each(this.prefixesStyles, function(p) {
            style[p + 'transition-property'] = css3Props.join();
            style[p + 'transition-duration'] = opt.duration + 'ms';
            style[p + 'transition-delay'] = '200ms';
            //TODO(nico) add transition
            style[p + 'transition-timing-function'] = 'ease-in-out';
          });
    
          style.top = ((pos.y + size.height /2) >> 0) + 'px';
          style.left = ((pos.x + size.width /2) >> 0) + 'px';
          style.width = (endWidth >> 0) + 'px';
          style.height = (endHeight >> 0) + 'px';
      }
      opt.onBeforeAnimateLabel(label, node);
   },

   /*
      Method: getOrCreateLabel
  
      Calls _getLabel_, if not label is found it creates a new one.
  
      Parameters:
  
      id - (string) The label id (which is also a <Graph.Node> id).
  
      Returns:
  
      The label element.
  
      Example:
  
     (start code js)
       var viz = new $jit.Viz(options);
       var label = viz.labels.getOrCreateLabel('someid');
       alert(label.innerHTML);
     (end code)
  
   */
   getOrCreateLabel: function(node) {
     var id = node.id, tag = this.getLabel(id);
     if(!tag && !(tag = document.getElementById(id))) {
       tag = document.createElement('div');
       var container = this.getLabelContainer();
       tag.id = id;
       tag.className = 'node';
       tag.style.position = 'absolute';
       this.viz.config.onCreateLabel(tag, node);
       container.appendChild(tag);
       this.labels[node.id] = tag;
     }
     return tag;
   }
});

/*
   Class: Graph.Label.SVG

   Implements SVG labels.

   Extends:

   All <Graph.Label.DOM> methods.
*/
Graph.Label.SVG = new Class({
    Implements: Graph.Label.DOM,

    /*
    Method: getOrCreateLabel

    Calls _getLabel_, if not label is found it creates a new one.

    Parameters:

    id - (string) The label id (which is also a <Graph.Node> id).

    Returns:

    The label element.

    Example:

   (start code js)
     var viz = new $jit.Viz(options);
     var label = viz.labels.getOrCreateLabel('someid');
   (end code)

 */
 getOrCreateLabel: function(node) {
   var id = node.id, tag = this.getLabel(id);
   if(!tag && !(tag = document.getElementById(id))) {
     var ns = 'http://www.w3.org/2000/svg';
     tag = document.createElementNS(ns, 'svg:text');
     var tspan = document.createElementNS(ns, 'svg:tspan');
     tag.appendChild(tspan);
     var container = this.getLabelContainer();
     tag.setAttribute('id', id);
     tag.setAttribute('class', 'node');
     container.appendChild(tag);
     this.viz.controller.onCreateLabel(tag, node);
     this.labels[node.id] = tag;
   }
   return tag;
 }
});

