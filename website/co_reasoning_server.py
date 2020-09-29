from flask import make_response, request, render_template, url_for, jsonify, redirect, session
from website.ArgumentNode import ArgumentNode
from website.utility.reason import get_need_reasons
from typing import Optional
from requests import get, post
from uuid import uuid4
import os
import re
import json
#zheng_website is a package (which has __init__.py)
from website.app import app, DATA_DIRECTORY, KNOWLEDGE_API, INFERENCE_API
#Assume this co_reaosning_server run in the same docker network as 'knowledge_server' 
#In docker, knowledge is the container of 'knowledge_server'

app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'

# @app.route('/interaction_page')
@app.route('/modification')
def index():
    path_index = request.args['path_index']
    paths = [
            {
                'attention_weight': 0.1,
                'reasoning_path': 'leftover related to remaining synonym rest'
            },
            {
                'attention_weight': 0.1,
                'reasoning_path': 'leftover is a remainder related to possession related to belonging'
            },
            {
                'attention_weight': 0.1,
                'reasoning_path': 'leftover related to reserve related to ration related to food'
            },
            {
                'attention_weight': 0.1,
                'reasoning_path': 'pretend motivated by goal playing used for competing causes competition'
            },
            {
                'attention_weight': 0.1,
                'reasoning_path': 'pretend motivated by goal actor is a person desires independent'
            }]
    path = paths[int(path_index)]['reasoning_path']
    print(path)
    #print(os.path.dirname(app.instance_path))
    resp = make_response(render_template('index.html', path=path, css=url_for('static', filename="css/main.css")))
    #resp = make_response(render_template('tree_with_gojs.html'))
    resp.headers['Access-Control-Allow-Origin'] = '*' #to support the cross origin request
    resp.cache_control.max_age = 1
    return resp


@app.route('/path_selection')
def path_selection():
    resp = make_response(render_template('path_selection.html', css=url_for('static', filename="css/main.css")))
    return resp

@app.route('/')
@app.route('/task_description')
def task_description():
    session['uid'] = uuid4()
    resp = make_response(render_template('task_description.html', css=url_for('static', filename="css/main.css")))
    return resp

@app.route('/modification_guide')
def interaction_guide():
    resp = make_response(render_template('interaction_guide.html',  edge_menu_screenshot=url_for('static', filename="img/UI_edge_menu.JPG") ,node_menu_screenshot=url_for('static', filename="img/UI_node_menu.JPG"), add_node_screenshot=url_for('static', filename="img/UI_create_node.JPG"), entire_ui_screenshot=url_for('static', filename="img/UI_screenshot.JPG") ,css=url_for('static', filename="css/main.css")))
    return resp

@app.route('/user_task')
def user_task():
    resp = make_response(render_template('user_task.html', css=url_for('static', filename="css/main.css")))
    return resp

@app.route('/survey')
def survey():
    resp = make_response(render_template('survey.html', css=url_for('static', filename="css/main.css")))
    return resp

@app.route('/submit_log', methods=["POST"])
def submit_log():
    #store the json file of log data locally
    log_data = request.get_json()
    with open("interaction_log/log_{}.json".format(session['uid']), "w") as f:
        print("write log: {}".format("log_"+str(session['uid'])+".json"))
        json.dump(log_data, f)
    
    return "Success"

@app.route('/form_submit', methods=['GET', 'POST'])
def form_submit():
    #store the json file of survey data locally
    survey_data = request.form
    with open("survey_data/survey_{}.json".format(session['uid']), "w") as f:
        json.dump(survey_data, f)
    return redirect(url_for('thanks'))

@app.route('/thanks')
def thanks():
    resp = make_response(render_template('thanks.html', css=url_for('static', filename="css/main.css")))
    return resp

@app.route('/path_json', methods=["POST"])
def path_json():
    print("Receive a Path Json...")
    model_json = request.get_json()
    model_node = model_json['nodeDataArray']
    model_edge = model_json['linkDataArray']

    argument_nodes = []
    for node in model_node:
        argument = ArgumentNode()
        argument.set_name(node['key'])
        for item in node['items']:
            if "Conclusion:" in item['name']:
                #get rid of "Conclusion: " at the beginning
                argument.set_conclusion(re.sub("Conclusion: ", "", item['name']))
            if "Premise" in item['name']:
                argument.add_premise(re.sub("Premise .: ", "", item['name']))
        argument_nodes.append(argument)

    print(str(argument_nodes))
    return jsonify(response_string=str(argument_nodes))


# @app.route('/introduction')
# def introduction():
#     resp = make_response(render_template('introduction.html', css=url_for('static', filename="css/main.css"), 
#     image_1=url_for('static', filename="interaction_illustration.JPG"),
#     image_2=url_for('static', filename="general_explanation_chart.JPG"),
#     image_3=url_for('static', filename="human_needs_explanation.JPG")))
#     return resp

# @app.route('/human_needs_explanation')
# def human_needs_explanation():
#     resp = make_response(render_template('human_needs_explanation.html', css=url_for('static', filename="css/main.css"),  img_source=url_for('static', filename="human_needs_explanation.JPG")))
#     return resp

# @app.route('/commonsense_explanation')
# def commonsense_explanation():
#     resp = make_response(render_template('commonsense_explanation.html', css=url_for('static', filename="css/main.css"),  img_source=url_for('static', filename="sample_kg.JPG"), 
#     further_step_image=url_for('static', filename="step-by-step image.png")))
#     return resp

# @app.route('/story_example')
# def story_example():
#     resp = make_response(render_template('story_example.html', css=url_for('static', filename="css/main.css"),  img_source=url_for('static', filename="story_example.JPG")))
#     return resp

# @app.route('/visualized_explanation')
# def visualized_exp():
#     resp = make_response(render_template('visualized_explanation.html', css=url_for('static', filename="css/main.css"), 
#      img_source=url_for('static', filename="visualized_sample.JPG"),
#      img_star_source=url_for('static', filename="star_chart.JPG"),
#      img_bar_source=url_for('static', filename="path_influence_chart.JPG")))
#     return resp

@app.route('/test')
def test():
    #print(os.path.dirname(app.instance_path))
    resp = make_response(render_template('test.html', css=url_for('static', filename="css/main.css")))
    resp.headers['Access-Control-Allow-Origin'] = '*' #to support the cross origin request
    resp.cache_control.max_age = 1
    return resp


SEARCH_LIMIT = 1000
REASON_LIMIT = 5


@app.route("/api/search/<string:text>", defaults={"speech": None})
@app.route("/api/search/<string:text>/<string:speech>")
def search(text: str, speech: Optional[str] = None):
    #create query the knowledge server
    query = f"{KNOWLEDGE_API}/search/{text}"\
        + (f"/{speech}" if speech else "")\
        + f"/{SEARCH_LIMIT}"
    #send query to the knowledge server
    return get(query).text


@app.route("/api/concept/<int:id>")
def concept(id: int):
    query = f"{KNOWLEDGE_API}/concept/{id}"

    return get(query).text


@app.route("/api/reason/<int:source>/<int:middle>/<int:target>")
def reason(source: int, middle: int, target: int):
    query_1 = f"{KNOWLEDGE_API}/reason/{source}/{middle}"
    query_2 = f"{KNOWLEDGE_API}/reason/{middle}/{target}"

    left_path = get(query_1).json()
    right_path = get(query_2).json()

    if len(left_path["path"]) > REASON_LIMIT:
        left_path["path"] = []

    if len(right_path["path"]) > REASON_LIMIT:
        right_path["path"] = []

    return {"left": left_path, "right": right_path}


@app.route("/api/assertion/<int:source>/<int:target>")
def assertion(source: int, target: int):
    query = f"{KNOWLEDGE_API}/assertion/{source}/{target}"

    response = get(query)

    if response.json() is None:
        return get(f"{KNOWLEDGE_API}/assertion/{target}/{source}").text

    return response.text


@app.route("/api/submit", methods=["POST"])
def submit():
    data = json.loads(request.data)

    current = datetime.datetime.now()
    filename = f"{data['username']}-{data['question']}-{current}"

    with open(os.path.join(DATA_DIRECTORY, filename), "w") as file:
        json.dump(data, file, indent=4)

    return "success"


@app.route("/api/story/fetch/<string:story_id>/<int:line>/<string:char>")
def fetch_story(story_id: str, line: int, char: str):
    fake_story_sample = [
        {'story_id': 'a2ddbb50-e45b-4ad3-becf-b2d8475172bf', 
        'sentences': ['I began making fish curry for my boyfriend and I.', 
                    'I decided not to read a recipe since I\'ve made so many in my life.', 
                    'I let the curry sit before tasting.', 
                    'When it was time to taste, I was disgusted.', 
                    'I accidentally used a whole garlic instead of a whole onion.'], 
        'character': 'I (myself)',
        'line': 2,
        'human_needs': 'curiosity'}, 
        {'story_id': '7148ffc4-0d04-4d9f-9286-ae7ae61a813a', 
        'sentences': ['Jervis has been single for a long time.', 
                    'He wants to have a girlfriend',
                    'One day he meets a nice girl at the grocery store.', 
                    'They begin to date.',
                    'He accidentally used a whole garlic instead of a whole onion.'], 
        'character': 'Jervis',
        'line': 4,
        'human_needs': 'food'}
        ]

    for story in fake_story_sample:
        if story_id == story['story_id']:
            #js will jsonify the story dict
            return story 

    return "fail"

@app.route('/modification', methods=["POST"])
def modification_page():
    #get the index of the path that is going to be modified
    json_request = request.get_json()
    print(index, type(index))
    paths = [
                {
                    'attention_weight': 0.05,
                    'reasoning_path': 'morning related to section related to family'
                },
                {
                    'attention_weight': 0.0432,
                    'reasoning_path': 'family has context biology related to study'
                },
                {
                    'attention_weight': 0.9023,
                    'reasoning_path': 'curiosity causes desire determine_truth has first subevent think'
            }]

    return redirect(url_for('index', path=paths[int(json_request['index'])]['reasoning_path']))

    # resp = make_response(render_template('index.html', path=paths[int(json_request['index'])]['reasoning_path'], css=url_for('static', filename="css/main.css")))
    # #resp = make_response(render_template('tree_with_gojs.html'))
    # resp.headers['Access-Control-Allow-Origin'] = '*' #to support the cross origin request
    # resp.cache_control.max_age = 1
    # return resp



@app.route('/api/send_paths/<string:uuid>/<int:line>/<string:char>', methods=["POST", "GET"])
def send_paths(uuid:str, line:int, char:str):
    #get_json return dict object
    graphs = request.get_json()
    modified_paths = get_need_reasons(graphs)
    query = f"{INFERENCE_API}/inference/{uuid}/{line}/{char}"

    data = post(query, json=modified_paths).json()
    print(data)

    #get the pred value for each human needs label
    pred_value = [v[0] for v in data['result']]
    rel_humans_needs = [v[1] for v in data['result']]
    #avoid to use np.argmin
    index_of_max = pred_value.index(max(pred_value))

    results = dict()
    results['story_id'] = data['uuid']
    results['paths'] = [ {'attention_weight': p[0], 'reasoning_path': p[1]} for p in data['reasons'] ]
    results['human_needs_pred'] = rel_humans_needs[index_of_max]
    
    return results


@app.route('/api/story/paths/<string:story_id>/<int:line>/<string:char>', methods=["POST", "GET"])
def fetch_paths(story_id: str, line: int, char: str):
    print("path request received")
    path_request_json = request.get_json()

    fake_path_sample = [
        {'story_id': 'a2ddbb50-e45b-4ad3-becf-b2d8475172bf', 
        'paths': [
            {
                'attention_weight': 0.05,
                'reasoning_path': 'morning related to section related to family'
            },
            {
                'attention_weight': 0.0432,
                'reasoning_path': 'family has context biology related to study'
            },
            {
                'attention_weight': 0.9023,
                'reasoning_path': 'curiosity causes desire determine_truth has first subevent think'
            }]
        }, 
        {'story_id': '7148ffc4-0d04-4d9f-9286-ae7ae61a813a', 
        'paths': [
            {
                'attention_weight': 0.05,
                'reasoning_path': 'look related to examine manner of question related to curiosity'
            },
            {
                'attention_weight': 0.0432,
                'reasoning_path': 'approval derived from approve related to good'
            },
            {
                'attention_weight': 0.9023,
                'reasoning_path': 'fail related to test related to skill used for safety'
            }]
        }
    ]
    

    for story in fake_path_sample:
        if story['story_id'] == story_id:
            #print(path_request_json['story_id'])
            return story

    return "fail"



if __name__ == '__main__':
    app.run(debug = True)    
