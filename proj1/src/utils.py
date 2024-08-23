import os
import json


def dir_exists(dir):
    """Tests if a directory exists and if not creates it

    Args:
        dir (str): Directory to test the existence of
    """

    try:
        os.mkdir(dir)
    except:
        pass


def write_to_json(path, obj):
    """Writes a json object to a file in path

    Args:
        path (str): File's path
        obj (dict): Json object to save
    """

    with open(path, 'w') as file:
        file.write(json.dumps(obj, indent=4))


def get_topics(path, topics = {}):
    """Retrieves topics from file

    Args:
        path (srt): File's path
        topics (dict, optional): Topics dictionary. Defaults to {}.

    Returns:
        dict: Topics read from file
    """

    try:
        file = open(path, 'r')
        try:
            topics = json.load(file)
        except:
            pass
        file.close()
    except:
        pass
    return topics
