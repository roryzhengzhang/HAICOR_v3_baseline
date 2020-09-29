import API from "../search/api.js";
import Utility from "../search/utility.js";

var $ = go.GraphObject.make;

export default class Go_Display {
    constructor (div_id)
    {
        this.diagram = go.Diagram.fromDiv(div_id);
        this.candidates = [];
        console.log("Display: "+div_id);
    }

    //parameter 'data' is a selected concept with attrs of (id, url, text)
    insert_from_search(new_node)
    {
        //insert a new node into the diagram
        // d is handler of diagram
        
        var data = {
            key: new_node.text,
            // items: [{name: "URL: "+new_node.url, iskey: true, figure: "Decision", color: colors.red},
            //         {name: "ID: "+new_node.id}],
            name: new_node.text
        }
        //add node into the model of the diagram
        this.diagram.model.commit(m => m.addNodeData(data), "Add New Node");
    }

    clean_canvas()
    {
        this.diagram.model.commit(m => {
            console.log("node_data_array: "+m.nodeDataArray);
            //since m.linkDataArray and m.nodeDataArray are read-only, we have to pass the writable copies to remove function
            var copy_linkArray = [... m.linkDataArray];
            var copy_nodeArray = [... m.nodeDataArray];
            m.removeLinkDataCollection(copy_linkArray);
            m.removeNodeDataCollection(copy_nodeArray);
        });
    }

    //accept a node name
    insert(new_node)
    {
        var data = {
            key: new_node,
            // items: [{name: "URL: from reasoning path", figure: "Decision", color: '#52ce60'},
            //         {name: "ID: xxx"}],
            name: new_node
        }

        this.diagram.model.commit(m => m.addNodeData(data), "Add New Node");
    }

    insert_edge(new_link) {
        console.log(new_link);
        new_link = JSON.parse(new_link);
        var link_data = {key: new_link.start_node+" to "+new_link.end_node, from: new_link.start_node, to: new_link.end_node, text: new_link.relation, toText: "1"};
        console.log(link_data);
        this.diagram.model.commit(m => m.addLinkData(link_data), "Add New Edge");
    }

    async connect()
    {
        console.log("selection: "+this.diagram.selection.size);
        //selected_set = this.diagram.selection;
        //this.diagram.selection is a read-only variable, cannot be assigned to other variables
        var it = this.diagram.selection.iterator;
        while(it.next())
            if (it.value instanceof go.Node)
                //the key of node is concept name
                this.candidates.push(it.value.key);

                if (this.candidates.length != 3)
                return; // invalid selection for connection
    
        let [source, middle, target] = this.candidates;

        let data = await fetch(API.assertion_search(source, middle, target))
            .then(response => response.json())
            .catch(error => console.log(error));

        // insert nodes
        for (var id of data.left.path)
            await fetch(API.concept(id))
            .then(response => response.json())
            .then(data => this.insert_from_search(data))
            .catch(error => console.log(error));

        for (var id of data.right.path)
            await fetch(API.concept(id))
            .then(response => response.json())
            .then(data => this.insert_from_search(data))
            .catch(error => console.log(error));

        // insert edges
        // if (data.left.connected && data.left.path.length == 0)
        //     // require more detail
        //     this.assertion_required(source, middle);

        for (var i = 0; i < data.left.path.length - 1; ++i)
            this.assertion_concrete(data.left.path[i], data.left.path[i + 1]);

        // if (data.right.connected && data.right.path.length == 0)
        //     // require more detail
        //     this.assertion_required(middle, target);

        for (var i = 0; i < data.right.path.length - 1; ++i)
            this.assertion_concrete(data.right.path[i], data.right.path[i + 1]);

        // remove required edge that are explained
        //this.unselect();

        for (var assertion of this.edge_data)
            if (assertion.source.id == source && assertion.target.id == target && assertion.required)
                assertion.selected = true;

        //this.remove();
        
    }

    async assertion_concrete(source, target) {
        //the assertion (edge) return by ConceptNet
        let data = await fetch(API.assertion(source, target))
            .then(response => response.json())
            .catch(error => console.log(error));

        //check if this link has existed
        if(this.diagram.findLinkForKey(data.source_id+" To "+data.target_id))
            return;
        
        myDiagram.model.commit(function (m){
            //console.log(target_node.data)
                myDiagram.model.addLinkData({ key: data.source_id+" To "+data.target_id, from: data.source_id, to: data.target_id, text: data.relations, toText: "1" })
            }, "addLink");
    }
}

export class Go_Path {
    constructor (master, reasoning_path)
    {
        console.log("create go_path: "+this.reasoning_path);
        this.master = master;
        this.reasoning_path = reasoning_path;
        //elements in nodeArray/linkArray should match the format in go.nodeArray/go.linkArray
        this.nodeArray = [];
        this.linkArray = [];
        console.log("create go_path: "+this.reasoning_path);
        this.parse_path();
        this.render();
    }

    render()
    {
        this.display_node(this.nodeArray);
        this.display_link(this.linkArray);

    }

    //parse paths in natural language into the nodeArray and linkArray
    //each node should have unique key, especially for those having the same concept name
    parse_path()
    {
        //relations are from the ConceptNet Relations
        var relations = ['related to', 'form of', 'is a', 'part of', 'has a', 'used for', 'capable of', 'at location', 'causes desire',
                    'causes', 'has subevent', 'has first subevent', 'has last subevent', 'has prerequisite', 'has property',
                    'motivated by goal', 'obstructed by', 'desires', 'created by', 'synonym', 'antonym', 'distinct from', 
                    'derived from', 'symbol of', 'defined as', 'manner of', 'located near', 'has context', 'similar to', 
                    'etymologically related to', 'etymologically derived from', 'made of', 'receives action',
                    'external url']

        //create regExp through constructor, and specify the global matching (matches the pattern globally)
        var re_pattern = new RegExp("("+relations.join('|')+")", "g");

        var split_tokens = this.reasoning_path.split(re_pattern);
        //strip the whitespace, compatible for browsers that doesn't support trim() function
        split_tokens =  split_tokens.map(token => token.replace(/(^[ '\^\$\*#&]+)|([ '\^\$\*#&]+$)/g, ''));

        var relations_in_paths = split_tokens.filter(word => relations.includes(word));

        this.nodeArray = split_tokens.filter(word => !relations.includes(word));

        var links = [];

        for(var i=0; i < relations_in_paths.length; i++)
        {
            var rel = relations_in_paths[i];
            var start_node = this.nodeArray[i];
            var end_node = this.nodeArray[i+1];

            links.push(JSON.stringify({
                'relation': rel,
                'start_node': start_node,
                'end_node': end_node
            }));
        }

        this.linkArray = links;

        console.log("parsed nodes: "+this.nodeArray);
        console.log("parsed relations: "+this.linkArray);
    }

    display_node(nodes){
        for(var i=0; i<nodes.length; i++)
        {
            //node is the node name in plain text
            this.master.insert(nodes[i]);
        }
    }

    display_link(links){
        for (var i = 0; i < links.length; i++)
        {
            //link is json string contains the link represented by [starting node, relation, ending node]
            this.master.insert_edge(links[i]);
        }
    }
}