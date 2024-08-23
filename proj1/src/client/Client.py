import zmq
import signal
import sys
import time

sys.path.insert(0, './../')
from utils import *

# just for ctrl-c (windows)
signal.signal(signal.SIGINT, signal.SIG_DFL)

REQUEST_TIMEOUT = 2500
REQUEST_RETRIES = 3


class Client():
    def __init__(self, port, type, id, topic):
        self.topic = topic
        self.id = id
        self.seq = 0
        self.type = type
        self.port = port
        self.connect()
        self.topics = get_topics(self.path)
        self.response = None
        dir_exists('../data')


    def connect(self):
        """Creates and binds socket
        """

        self.context = zmq.Context()
        self.socket = self.context.socket(zmq.REQ)
        self.socket.connect('tcp://localhost:' + self.port)

    def update_file_info(self):
        """Updates client data file
        """

        self.topics.update(self.message)
        write_to_json(self.path, self.topics)


    def handle_general_responses(self):
        """Handles general client response and receives said response
        """

        retries_left = REQUEST_RETRIES

        while True:
            if (self.socket.poll(REQUEST_TIMEOUT) & zmq.POLLIN) != 0:
                self.response = self.socket.recv_json()
                # there is data to read from server
                retries_left = REQUEST_RETRIES

                match self.response['code']:
                    case 403:
                        print(self.response['reply'])
                    case 404:
                        print(self.response['reply'])
                    case 500:
                        # POSSIBLE SOLUTION: dar unsubscribe e subscribe seguido maybe?
                        print(self.response['reply'])
                break

            # no data to read from server
            retries_left -= 1
            print("Polling server... attempts left [" + str(retries_left) + "]")

            # Socket is confused. Close and remove it.
            self.socket.setsockopt(zmq.LINGER, 0)
            self.socket.close()

            if retries_left == 0:
                print("Server seems to be offline, abandoning...")
                sys.exit()

            # Create new connection
            self.connect()
            print("Resending request...")
            self.socket.send_json(self.message)


    def send_request(self):
        """Sends request to server
        """

        self.socket.send_json(self.message)
        self.handle_general_responses()
