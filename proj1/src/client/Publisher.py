from Client import Client
import sys
import time

sys.path.insert(0, './../')
from utils import *


class Publisher(Client):
    def __init__(self, port, type, id, topic, publication):
        self.path = '../data/publisher/client_' + str(id) + '.json'
        super().__init__(port, type, id, topic)
        self.publication = publication
        self.seq = self.topics[topic]['seq'] if len(self.topics) != 0 and topic in self.topics else 0

        dir_exists('../data/publisher')
        self.build_message()


    def build_message(self):
        """Creates the publisher message
        """
        self.message = {
            self.topic:
            {
                'id': self.id,
                'seq': self.seq,
                'type': self.type,
                'msg': self.publication
            }
        }


    def put(self):
        """Sends a publish request to server
        """

        self.send_request()

        match self.response['code']:
            case 200:
                self.seq += 1
                self.build_message()
                self.update_file_info()
                print(self.response['reply'])


def main(argv):
    usage = 'Action not recognized.\nUsage: publisher.py <port> <id> <topic> <message>'

    if len(argv) != 4:
        print(usage)
        return

    port = argv[0]
    op = 'PUT'
    id = argv[1]
    topic = argv[2]
    msg = ' '.join(argv[3:])

    client = Publisher(port, op, id, topic, msg)
    client.put()


if __name__ == '__main__':
    main(sys.argv[1:])
    