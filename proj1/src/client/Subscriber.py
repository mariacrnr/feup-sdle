from Client import Client
import sys

import time

sys.path.insert(0, './../')
from utils import *


class Subscriber(Client):
    def __init__(self, port, type, id, topic):
        self.path = '../data/subscriber/client_' + str(id) + '.json'
        super().__init__(port, type, id, topic)
        self.seq = self.topics[topic]['seq'] if len(self.topics) != 0 and topic in self.topics else 0

        dir_exists('../data/subscriber')
        self.build_message()


    def build_message(self):
        """Creates the subscriber message
        """
        self.message = {
            self.topic:
            {
                'id': self.id,
                'seq': self.seq,
                'type': self.type,
            }
        }


    def get(self, several):
        """Requests a message from the server

        Args:
            several (bool): Get all messages from topic or just one
        """
        if several:
            continue_loop = True
            while continue_loop:
                self.send_request()
                continue_loop = self.handleGetResponses()
        else:
            self.send_request()
            self.handleGetResponses()




    def handleGetResponses(self):
        """Handle specific subscriber responses

        Returns:
            bool: True if there where messages in the server queue, false otherwise
        """

        match self.response['code']:
            case 200:
                self.seq += 1
                self.build_message()
                self.update_file_info()
                print(self.response['reply'])

            case 204:
                print(self.response['reply'])
                return False
        return True


    def subscribe(self):
        """Sends a subscription request to server
        """

        self.send_request()

        match self.response['code']:
            case 200:
                self.build_message()
                self.update_file_info()
                print(self.response['reply'])
            case 304:
                print(self.response['reply'])


    def unsubscribe(self):
        """Sends an unsubscription request to server
        """

        self.send_request()
        match self.response['code']:
            case 200:
                self.delete_from_json()
                print(self.response['reply'])


    def delete_from_json(self):
        """
            Deletes subscriber from topics and file
        """

        self.topics.pop(self.topic)
        write_to_json(self.path, self.topics)


def main(argv):
    usage = 'Action not recognized.\nUsage: subscriber.py <port> <id> SUB|UNSUB|GET <topic>'

    if len(argv) != 4:
        print(usage)
        return

    port = argv[0]
    id = argv[1]
    op = argv[2].upper()
    topic = argv[3]

    client = Subscriber(port, op, id, topic)

    match client.type:
        case 'SUB':
            client.subscribe()
        case 'UNSUB':
            client.unsubscribe()
        case 'GET':
            client.get(False)
        case _:
            print(usage)


if __name__ == '__main__':
    main(sys.argv[1:])
