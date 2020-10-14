var jq = $.noConflict(); //defien the JQuery and avoid conflict with go.js
var $ = go.GraphObject.make;

//create the diagram object
var myDiagram = $(go.Diagram, "myGoDiv",
  {
    "undoManager.isEnabled": true,
    layout: $(go.ForceDirectedLayout),
    allowDelete: false,
    allowCopy: false
  }
);

//define the color map
var colors = {
  'red': '#be4b15',
  'green': '#52ce60',
  'blue': '#6ea5f8',
  'lightred': '#fd8852',
  'lightblue': '#afd4fe',
  'lightgreen': '#b9e986',
  'pink': '#faadc1',
  'purple': '#d689ff',
  'orange': '#fdb400',
}

var log_data = [];

// var contextMenu = $(go.HTMLInfo, {
//   show: showContextMenu,
//   hide: hideContextMenu
// });

var real_contextMenu = document.getElementById("contextMenu");

//define the item template, which will be shown as a row in node
var ItemTemplate = $(go.Panel, "Horizontal",
  //define the attr of each item panel
  $(go.Shape, //define the preceding figure shape in each item panel
    { desiredSize: new go.Size(15, 15), strokeJoin: "round", strokeWidth: 3, stroke: null, margin: 2 },
    new go.Binding("figure", "figure"), //bind the figure shape to each item
    new go.Binding("fill", "color"),
    new go.Binding("stroke", "color")
  ),
  $(go.TextBlock, //define the text block in each item (after the figure)
    { stroke: "#333333", font: "bold 16px sans-serif" },
    new go.Binding("text", "name")
  )
)

myDiagram.nodeTemplate =
  $(go.Node, "Auto",  // the whole node panel
    {
      selectionAdorned: true,
      resizable: true,
      layoutConditions: go.Part.LayoutStandard & ~go.Part.LayoutNodeSized,
      fromSpot: go.Spot.AllSides,
      toSpot: go.Spot.AllSides,
      isShadowed: true,
      //enable the contextMenu when right-click the node
      contextMenu: $("ContextMenu",
        $("ContextMenuButton",
          $(go.TextBlock, "Delete Node"),
          { click: deleteNode }),
        $("ContextMenuButton",
          $(go.TextBlock, "Modify Node"),
          { click: modifyNode }),
        $("ContextMenuButton",
          $(go.TextBlock, "Create Link"),
          { click: createLink })
      ),
      shadowOffset: new go.Point(3, 3),
      shadowColor: "#C5C1AA"
    },
    new go.Binding("location", "location").makeTwoWay(),
    // whenever the PanelExpanderButton changes the visible property of the "LIST" panel,
    // clear out any desiredSize set by the ResizingTool.
    new go.Binding("desiredSize", "visible", function (v) { return new go.Size(NaN, NaN); }).ofObject("LIST"),
    // define the node's outer shape, which will surround the Table
    $(go.Shape, "RoundedRectangle",
      { fill: 'white', stroke: "#eeeeee", strokeWidth: 3 }),
    $(go.Panel, "Table",
      { margin: 8, stretch: go.GraphObject.Fill },
      $(go.RowColumnDefinition, { row: 0, sizing: go.RowColumnDefinition.None }),
      // the table header
      $(go.TextBlock,
        {
          row: 0, alignment: go.Spot.Center,
          margin: new go.Margin(0, 24, 0, 2),  // leave room for Button
          font: "bold 16px sans-serif"
        },
        new go.Binding("text", "name")),
      // the collapse/expand button
      // $("PanelExpanderButton", "LIST",  // the name of the element whose visibility this button toggles
      //   { row: 0, alignment: go.Spot.TopRight }),
      // the list of Panels, each showing an attribute
      $(go.Panel, "Vertical",
        {
          name: "LIST",
          row: 1,
          padding: 3,
          alignment: go.Spot.TopLeft,
          defaultAlignment: go.Spot.Left,
          stretch: go.GraphObject.Horizontal,
          itemTemplate: ItemTemplate
        },
        new go.Binding("itemArray", "items"))
    )  // end Table Panel
  );  // end Node

// --------------------Define the context menu----------------------------
//define the contextMenu which will pop up when click the background

//define the background menu which will pop up when the background is clicked
myDiagram.contextMenu =
  $("ContextMenu",
    $("ContextMenuButton",
      $(go.TextBlock, "New Node"),
      {
        click: function (e, obj) {
          var new_node_name = "";

          e.diagram.commit(function (d) {
            jq("#NodeAdditionModal").modal("toggle");
            jq("#node-name-addition-input").val();

            jq('#Node-addition-save-button').unbind('click').click(function (ev) {
              ev.stopPropagation();
              //get the new name that user inputs
              new_node_name = jq('#node-name-addition-input').val();
              if (myDiagram.findNodeForKey(new_node_name)) {
                alert("There is already a node with same name");
              }
              else {
                var data = {
                  key: new_node_name,
                  name: new_node_name
                };

                myDiagram.model.commit(function (m) {
                  d.model.addNodeData(data);
                  part = d.findPartForData(data);
                  //set the location of the created node as the current location of contextMenu
                  part.location = d.toolManager.contextMenuTool.mouseDownPoint;
                }, "flash"
                );
                jq('#NodeAdditionModal').modal('hide');
                jq('#node-name-addition-input').attr("value", "");
                var record = {
                  type: "new node creation",
                  new_node_name: new_node_name
                }
                log_data.push(record);
              }

            });
          })

        }
      }
    )
  )



function createLink(e, obj) {
  jq('#EdgeModal').modal('toggle');
  var source_node_key = obj.part.data.key;
  jq('#Edge-Save-Button').unbind('click').click(function (ev) {

    var target_node_key = jq('#edge-name-input').val();
    var new_link = { key: source_node_key + " to " + target_node_key, from: source_node_key, to: target_node_key, text: "related to", toText: "1" };
    myDiagram.model.commit(function (m) {
      var target_node = myDiagram.findNodeForKey(target_node_key)
      console.log("target node: " + target_node)
      //console.log(target_node.data)
      if (target_node) {
        myDiagram.model.addLinkData(new_link);
      }
    }, "addLink");

    //record the link creation operation in log_data
    var record = {
      type: "new link creation",
      link_data: new_link,
    };
    log_data.push(record);

    jq('#EdgeModal').modal('hide');
    jq('#edge-name-input').attr("value", "");
  });
}

//define the Delete_Node function, which is fired in node contextMenu
function modifyNode(e, obj) {
  //get the node object
  var node = obj.part;
  //console.log(node.data);
  var arg_title = node.data.key;
  var old_node_name = node.data.name;
  var new_node_name = "";
  var org_items = node.data.items;
  //must create a copy of the original "items" dict, otherwise "org_items" will refer to the exact objects of "node.data.items"
  //The go.js will capture any changes to "node.data.items", however, the 'model.set' function will compare the new value and old value, and it will not update if no update happens.
  //The problem is, since the change of "org_items (node.data.items)" firstly happens at assignment time (like "copy_dict[0]['name'] = "Conclusion: "+new_node_name"), if we don't make a copy, this change will be refered as 'old_value' (since it directly changes node.data.items), and the go.js will assume there is not update occurred and thus no visual update will be made
  var copy_dict = { ...org_items };
  //console.log("items before: "+org_items[0]['name']);
  jq('#NodeModal').modal('toggle');
  jq('#node-name-input').attr("value", arg_title);
  jq('#Node-Save-Button').unbind('click').click(function (ev) {
    ev.stopPropagation();
    //get the new name that user inputs
    new_node_name = jq('#node-name-input').val();
    if (myDiagram.findNodeForKey(new_node_name)) {
      alert("There is already a node with same name");
    }
    else {
      myDiagram.model.commit(function (m) {
        var org_node = myDiagram.findNodeForKey(arg_title);
        // copy_dict[0]['name'] = "Conclusion: "+new_node_name;
        //update the "items" property
        m.set(org_node.data, "name", new_node_name);
        m.set(org_node.data, "key", new_node_name);
      }, "flash"
      );
      var record = {
        type: "modify node",
        modify_node_info: { old_name: old_node_name, new_name: new_node_name }
      };
      log_data.push(record);

      jq('#NodeModal').modal('hide');
      jq('#node-name-input').attr("value", "");

      //update the link that has this modified node as "from" or "to" node
      myDiagram.links.each(function (l) {
        if (l.data.from == old_node_name) {
          m.set(l.data, "from", new_node_name);
        }
        else if (l.data.to == old_node_name) {
          m.set(l.data, "to", new_node_name);
        }
      });
    }
  });

  // myDiagram.model.commit(function (m){
  //   var org_node = myDiagram.findNodeForKey(arg_title);
  //   org_items[0]['name'] = "Conclusion: OK";
  //   //console.log(org_items[0])
  //   m.set(org_node.data, "items", org_items);
  // }, "flash"
  // );

}

function deleteNode(e, obj) {
  myDiagram.startTransaction();
  var node = obj.part.adornedPart;
  myDiagram.remove(node);
  myDiagram.commitTransaction("delete " + node.data.key + " Node");
  var record = {
    type: "delete node",
    delete_node: node.data.name
  };
  log_data.push(record);
}

function deleteEdge(e, obj) {
  myDiagram.startTransaction();
  var edge = obj.part.adornedPart;
  myDiagram.model.removeLinkData(edge.data);
  myDiagram.commitTransaction("delete " + edge.data.key + " Edge");
  var record = {
    type: "delete link",
    delete_link: edge.data
  };
  log_data.push(record);
}

function modifyEdge(e, obj) {
  var edge = obj.part.adornedPart;
  var edge_key = edge.data.key;
  console.log(edge_key);
  var old_edge_name = edge.data.text;
  var new_edge_name = "";
  jq('#EdgeModificationModal').modal('toggle');
  jq('#edge-name-mod-input').attr("value", old_edge_name);
  jq('#Edge-Save-Mod-Button').unbind('click').click(function (ev) {
    ev.stopPropagation();
    //get the new name that user inputs
    new_edge_name = jq('#edge-name-mod-input').val();

    myDiagram.model.commit(function (m) {
      var org_edge = myDiagram.findLinkForData(edge.data);
      console.log(org_edge);
      m.set(org_edge.data, "text", new_edge_name);
    }, "flash"
    );
    jq('#EdgeModificationModal').modal('hide');
    jq('#edge-name-mod-input').attr("value", "");
  });
  var record = {
    type: "modify link",
    modify_link_info: edge.data
  };
  log_data.push(record);
}

jq("#workplace").click(() => {
  console.log(myDiagram.model.toJson());
});

myDiagram.linkTemplate = $(go.Link,
  {
    selectionAdorned: true,
    layerName: "Foreground",
    reshapable: true,
    routing: go.Link.AvoidsNodes,
    corner: 5,
    curve: go.Link.JumpOver,
    contextMenu: $("ContextMenu",
      $("ContextMenuButton",
        $(go.TextBlock, "Delete Edge"),
        { click: deleteEdge }),
      $("ContextMenuButton",
        $(go.TextBlock, "Modify Relation Type"),
        { click: modifyEdge })
    ),
  },
  $(go.Shape,  // the link shape
    { stroke: "#303B45", strokeWidth: 2.5 }),
  $(go.Shape, { toArrow: "Standard" }),
  $(go.TextBlock,
    {
      textAlign: "center",
      font: "bold 14px sans-serif",
      stroke: "#de4463",
    },
    new go.Binding("text", "text"))
);

// create the model for the E-R diagram
var nodeDataArray = [
  // {
  // key: "Argument 1",
  // items: [{ name: "Conclusion: Tim was happy", iskey: true, figure: "Decision", color: colors.red },
  // { name: "Premise 1: Tim and I are close friend", iskey: false, figure: "Decision", color: colors.blue },
  // { name: "Premise 2: I make an achievement", iskey: false, figure: "Decision", color: colors.blue },
  // { name: "Premise 3: Close friend's achievement will make someone happy", iskey: false, figure: "Decision", color: "purple" }]
  // },
  // {
  // key: "Argument 2",
  // items: [{ name: "Conclusion: I make an achievement", iskey: true, figure: "Decision", color: colors.red },
  // { name: "Premise 1: I won the chessing game", iskey: false, figure: "Hexagon", color: colors.blue },
  // { name: "Preimise 2: Winning game is my achievement", iskey: false, figure: "Hexagon", color: colors.blue }]
  // },
  // {
  // key: "Argument 3",
  // items: [{ name: "Conclusion: Tim was happy", iskey: true, figure: "Decision", color: colors.red },
  // { name: "Premise 1: I won the game", iskey: false, figure: "Hexagon", color: colors.blue },
  // { name: "Premise 2: Tim and I are close friends", iskey: false, figure: "Hexagon", color: colors.blue }]
  // },
  // {
  // key: "Argument 4",
  // items: [{ name: "Conclusion", iskey: true, figure: "Decision", color: colors.red },
  // { name: "Premise 1", iskey: true, figure: "Hexagon", color: colors.red },
  // { name: "Premise 2", iskey: false, figure: "Hexagon", color: colors.green },
  // { name: "Premise 3", iskey: false, figure: "Hexagon", color: colors.green },
  // { name: "Premise 4", iskey: false, figure: "Hexagon", color: colors.green }]
  // },
];

var linkDataArray = [
  // { key: "arg 2 To arg1", from: "Argument 2", to: "Argument 1", text: "related to", toText: "1" },
  // // { from: "Argument 3", to: "Argument 2", text: "related to", toText: "1" },
  // // { from: "Argument 3", to: "Argument 4", text: "related to", toText: "1" }
];

myDiagram.model = $(go.GraphLinksModel,
  {
    copiesArrays: true,
    copiesArrayObjects: true,
    nodeDataArray: nodeDataArray,
    linkDataArray: linkDataArray
  });


jq('#printButton').click(function () {
  jsonOutput = myDiagram.model.toJson();
  console.log(jsonOutput);
  jq.ajax(
    {
      url: 'path_json',
      data: jsonOutput,
      contentType: "application/json;charset=UTF-8",
      type: "POST",
      success: function (response) {
        // need to stringify the response first
        response = JSON.parse(JSON.stringify(response))
        console.log(response['response_string'])
      },
      error: function (response) {
        console.log("Error occurred when sned json to backend server")
      }
    }
  )
})
