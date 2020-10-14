'''
Create csv of collected log information
'''

import pandas as pd
import numpy as np
import json
import os
import re
pattern = "log"
dir = "./temp_data"

log_list = [file for file in os.listdir(dir) if pattern in file]

cols = ["id", "original path", "op sequence", "resulting path", "duration", "create from scratch"]

df = pd.DataFrame(columns = cols)

for file in log_list:
    path = os.path.join(os.getcwd(), "temp_data/"+file)
    print(path)
    with open(path, "r") as f:
        log = json.load(f)
        log_dict = {}
        re_pattern = map(re.escape, ["_", "."])
        re_pattern = "|".join(re_pattern)
        log_dict['id'] = re.split(re_pattern, file)[1]
        log_dict['original path'] = log['original_path']
        #get the operation sequence
        op_seq = ""
        for op in log['operation_sequence']:
            if op['type'] == 'new node creation':
                op_seq += op['type'] + ": " + op['new_node_name'] + "; "
            elif op['type'] == 'delete node':
                op_seq += op['type'] + ": " + op['delete_node'] + "; "
            elif op['type'] == 'new link creation':
                op_seq += op['type'] + ": " + op['link_data']['from'] + " " + op['link_data']['text'] + " " +  op['link_data']['to'] + "; "
            elif op['type'] == 'modify link':
                op_seq += op['type'] + ": " + op['modify_link_info']['from'] + " " + op['modify_link_info']['text'] + " " +  op['modify_link_info']['to'] + "; "
            elif op['type'] == 'modify node':
                #modify node
                op_seq += op['type'] + ": " + op['modify_node_info']['old_name'] + " to " + op['modify_node_info']['new_name']
            else:
                #delete link
                op_seq += op['type'] + ": " + op['delete_link']['from'] + " to " + op['delete_link']['text'] + " " +  op['delete_link']['to'] + "; "

        log_dict['operation sequence'] = op_seq

        #get the resulting path
        resulting_rel = ""
        result_path_json = json.loads(log["resulting_path"])
        for link in result_path_json["linkDataArray"]:
            resulting_rel += f"{link['from']} {link['text']} {link['to']}; "
        log_dict["resulting path"] = resulting_rel
        
        log_dict['duration'] = log['duration']
        log_dict['create from scratch'] = log['is_start_over']

        df = df.append(log_dict, ignore_index=True)

df.to_csv("log_data.csv", index=False)