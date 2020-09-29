# Copyright (c) 2020 HAICOR Project Team
#
# This software is released under the MIT License.
# https://opensource.org/licenses/MIT

#from __future__ import annotations

import os

from flask import Flask

#define the constant

#knowledge is the container of 'knowledge_server'
KNOWLEDGE_API = "http://knowledge:5000"

INFERENCE_API = "http://inference:5000"

DATA_DIRECTORY = os.path.abspath(os.getenv("DATA_DIRECTORY"))

app: Flask = Flask(__name__)
