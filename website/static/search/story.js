// Copyright (c) 2020 HAICOR Project Team
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import API from "./api.js";
import Utility from "./utility.js";
import {Go_Path} from "../go_js/go_diagram.js"

export default class Story {
    //create story object according to story_id
    constructor(master, story_id, story_zone) {
        //master is the go_display
        this.master = master;
        this.story_id = story_id;
        //this.story_menu = document.getElementById(story_menu);
        this.story_area = document.getElementById(story_zone);
        this.go_paths = [];
        this.master.clean_canvas();
    }

    //fetch story, prediction and reasoning_paths
    async fetch_story() {
        let query= API.fetch_story(this.story_id);

        this.ready(false);

        fetch(query).then(response => 
            {
                if(response == "fail")
                    throw "cannot find this story";
                else
                    return response.json();
            })
            .then(result => {
                // this.ready(true);
                this.render(result);
            })
            .catch(error => console.log(error));


        //fetch reasoning paths
        let path_query = API.fetch_reasoning_path(this.story_id, [0, 1] ,2);

        let path_query_data = {
            "story_id": this.story_id,
            "context_id": [0, 1], 
            "sentence_id": 2, 
            "character": "Jim"
        }

        //let path_query_data = '{ "story_id": this.story_id, "context_id": [0, 1], "sentence_id": 2, "character": "Jim" }'

        //convert the json string to json object
        path_query_data = JSON.stringify(path_query_data)

        console.log(path_query_data)

        jQuery.ajax({
            url: '/api/story/paths/'+this.story_id,
            //needs to stringify the json, rather than the js json object
            data: path_query_data,
            contentType: "application/json;charset=UTF-8",
            type: "POST",
            //use ananymous callbacks so that 'this' refers to the element
            success: (response) => {
                // need to stringify the response first
                if(response == "fail")
                    console.log("cannot find paths for story: "+ this.story_id);
                else
                {
                    console.log("pat_json: "+JSON.stringify(response))
                    var json_path = JSON.parse(JSON.stringify(response));
                    this.path_render(json_path);
                }
                
            },
            error: function(response){
                console.log("Error occurred when sned json to backend server")
            }
        });

        // fetch(path_query).then(path_response => {
        //     //in default, the server will return python dict, which will be encoded as string
        //     path_response.json();
        // })
        // .then(result => {
        //     this.path_render(path_response);
        // })

        this.ready(true);
        //console.log("soty is: "+this.story_id);
    }

    ready(state) {
        document.getElementById("storyDropdownMenu").value = state ? "Select story" : "Fetching story";
    }

    render(story_json) {
        document.getElementById('story-display-zone').innerText = "";

        //get the story narrative
        let story_name = document.createElement("p");
        story_name.textContent = story_json.name;
        this.story_area.append(story_name);
        
        for (var sentence of story_json.sentences) {
            let line = document.createElement("p");
            line.classList.add("story-line");
            line.textContent = sentence;

            this.story_area.append(line);
        }

        let line_num = document.createElement("p");
        line_num.innerHTML = "<strong>Line #:</strong> "+story_json.line;
        this.story_area.append(line_num);

        let character = document.createElement("p");
        character.innerHTML = "<strong>Character:</strong> "+story_json.character;
        this.story_area.append(character);

        let human_needs = document.createElement("p");
        human_needs.innerHTML = "<strong>human_needs:</strong> "+story_json.human_needs;
        this.story_area.append(human_needs);
    }

    path_render(path_json) {
        // suppose the json format is as below:
        // {'paths': [
        //     {
        //         'attention_weight': xxx,
        //         'reasoning_path': 'finish derived from driftfish related to family'
        //     }, 
        //     {
        //         ...
        //         ...
        //     }
        // ]}

        for(var path of path_json.paths) {
            let go_path = new Go_Path(this.master, path.attention_weight, path.reasoning_path);
            //go_path.render will render the paths it holds
            //go_path.render();
            //in javascript, 'push' is the methods to append element to an array
            this.go_paths.push(go_path);
        }

        // for(var i=0; i<this.go_paths.length; i++)
        // {
        //     console.log("go_paths: "+this.go_paths[i].reasoning_path);
        // }
        
            
    }
}