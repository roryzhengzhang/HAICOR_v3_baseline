import itertools

HUMAN_NEEDS = ["status", "approval", "tranquility", "competition", "health", "family", "romance", "food", "indep",
               "power", "order", "curiosity", "serenity", "honor", "belonging", "contact", "savings", "idealism", "rest"]


def get_all_reasons(graph, source):
    neighbor = [link for link in graph if link[0] == source]

    if len(neighbor) == 0:  # leaf node
        return [source]

    return [f"{source} {relation} {path}"
            for _, relation, target in neighbor
            for path in get_all_reasons(graph, target)]


def get_need_reasons(data):
    names = {node["key"]: node["name"].replace('_', ' ')
             for node in data["nodeDataArray"]}

    links = [(names[link["from"]], link["text"], names[link["to"]])
             for link in data["linkDataArray"]]

    nodes = set(i for i, _, _ in links).union(i for _, _, i in links)

    forward = [(source, relation, target)
               for source, relation, target in links]
    backward = [(target, relation, source)
                for source, relation, target in links]

    reasons = [get_all_reasons(graph, need)
               for graph in (forward, backward)
               for need in nodes.intersection(HUMAN_NEEDS)]

    return [reason for group in reasons for reason in group
            if reasons not in HUMAN_NEEDS]
