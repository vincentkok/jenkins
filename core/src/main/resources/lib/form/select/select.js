// send async request to the given URL (which will send back serialized ListBoxModel object),
// then use the result to fill the list box.
function updateListBox(listBox,url,config) {
    config = config || {};
    config = object(config);
    var originalOnSuccess = config.onSuccess;
    config.onSuccess = function(rsp) {
        var l = $(listBox);
        var currentSelection = l.value;

        // clear the contents
        while(l.length>0)   l.options[0] = null;

        var selectionSet = false; // is the selection forced by the server?
        var possibleIndex = null; // if there's a new option that matches the current value, remember its index
        var opts = eval('('+rsp.responseText+')').values;
        for( var i=0; i<opts.length; i++ ) {
            l.options[i] = new Option(opts[i].name,opts[i].value);
            if(opts[i].selected) {
                l.selectedIndex = i;
                selectionSet = true;
            }
            if (opts[i].value==currentSelection)
                possibleIndex = i;
        }

        // if no value is explicitly selected by the server, try to select the same value
        if (!selectionSet && possibleIndex!=null)
            l.selectedIndex = possibleIndex;

        if (originalOnSuccess!=undefined)
            originalOnSuccess(rsp);
    },
    config.onFailure = function(rsp) {
        // deleting values can result in the data loss, so let's not do that
//        var l = $(listBox);
//        l.options[0] = null;
    }

    new Ajax.Request(url, config);
}

Behaviour.register({
    "SELECT.select" : function(e) {
        // controls that this SELECT box depends on
        refillOnChange(e,function(params) {
            var value = e.value;
            updateListBox(e,e.getAttribute("fillUrl"),{
                parameters: params,
                onSuccess: function() {
                    if (value=="") {
                        // reflect the initial value. if the control depends on several other SELECT.select,
                        // it may take several updates before we get the right items, which is why all these precautions.
                        var v = e.getAttribute("value");
                        if (v) {
                            e.value = v;
                            if (e.value==v) e.removeAttribute("value"); // we were able to apply our initial value
                        }
                    }

                    // if the update changed the current selection, others listening to this control needs to be notified.
                    if (e.value!=value) fireEvent(e,"change");
                }
            });
        });
    }
});