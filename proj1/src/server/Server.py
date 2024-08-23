import datetime
import time
import zmq
import sys
import signal
import threading

sys.path.insert(0, './../')
from utils import *

signal.signal(signal.SIGINT, signal.SIG_DFL)

DEBUG = False


# subscribers, publishers and messages by topic
''' topic: {
        sub: {
            id: {
                seq
            }
            id: {
                seq
            }
        }
        pub: {
            id: {
                seq
            }
            id: {
                seq
            }
        }
        msg: []
    }'''


class Server:
    def __init__(self, port):
        self.port = port
        self.path = '../data/server/topics.json'
        self.connect()
        self.read_communication_data()
        self.reply = ''


    def connect(self):
        """Creates and binds socket
        """

        self.context = zmq.Context()
        self.socket = self.context.socket(zmq.REP)
        self.socket.bind('tcp://*:' + self.port)


    def read_communication_data(self):
        """Reads communication data from file (organized by topic)
        """

        dir_exists('../data')
        dir_exists('../data/server')
        self.topics = get_topics(self.path)


    def subscribe(self, topic, client_id):
        """Performs a subscription for a given client (subscriber)

        Args:
            topic (str): topic to subscribe to
            client_id (int): client's id (subscriber)
        """

        if DEBUG: print("-> Thread id:  " , threading.get_ident())
        if topic in self.topics:
            if client_id not in self.topics[topic]['sub']:
                self.topics[topic]['sub'][client_id] = {'seq': 0}
                self.code = 200
                self.reply = 'Subscribed to topic "' + topic + '".'
            else:
                self.code = 304 # not modified
                self.reply = 'Already subscribed to topic "' + topic + '".'
        else:
            self.topics[topic] = {'sub': {client_id: {'seq': 0}}, 'msg': [], 'pub': {}}
            self.code = 200
            self.reply = 'Subscribed to topic "' + topic + '".'

    def unsubscribe(self, topic, client_id):
        """Performs an unsubscription for a given client (subscriber)

        Args:
            topic (str): topic to subscribe to
            client_id (int): client's id (subscriber)
        """

        if DEBUG: print("-> Thread id:  " , threading.get_ident())
        if topic in self.topics:
            if client_id in self.topics[topic]['sub']:
                self.topics[topic]['sub'].pop(client_id)
                if len(self.topics[topic]['sub']) == 0:
                    self.topics.pop(topic)
                self.code = 200
                self.reply = 'Unsubscribed to topic "' + topic + '".'
            else:
                self.code = 403
                self.reply = client_id + ' not subscribed to topic "' + topic + '".'
        else:
            self.reply = 'Topic "' + topic + '" does not exist.'
            self.code = 404

    def get(self, topic, client_id, seq):
        """Sends a message stated by the seq (sequence number) from the given topic's queue to a client

        Args:
            topic (str): topic to send the message from
            client_id (int): client's id (subscriber)
            seq (int): sequence number (states how much messages the client have consumed and were received)
        """

        if DEBUG: print("-> Thread id:  " , threading.get_ident())
        if topic in self.topics:
            if client_id in self.topics[topic]['sub']:
                if self.topics[topic]['sub'][client_id]['seq'] == seq:
                    if len(self.topics[topic]['msg']) > seq:
                        self.reply = self.topics[topic]['msg'][seq]
                        self.topics[topic]['sub'][client_id]['seq'] += 1
                        self.code = 200 # 200 (all ok)
                    else:
                        self.code = 204 # 204 (no content)
                        self.reply = 'No more messages on topic "' + topic + '".'
                else:
                    self.code = 500 # 500 (internal server error)
                    self.reply = "Number of sequence in server (" +  str(self.topics[topic]['sub'][client_id]['seq']) + ") different from client's (" + str(seq) + "). Please unsubscribe client"
            else:
                self.code = 403 # 403 (forbidden)
                self.reply = "Subscriber [id: " + str(client_id) + "]" + ' not subscribed to topic "' + topic + '".'
        else:
            self.code = 404 # 404 (does not exist)
            self.reply = 'Topic "' + topic + '" does not exist.'


    def put(self, message, topic, client_id, seq):
        """Publishes a message to a given topic

        Args:
            message (str): the message to publish
            topic (str): topic to publish to
            client_id (int): client's id (publisher)
            seq (int): sequence number (states how much messages the client have sent and were received)
        """

        if DEBUG: print("-> Thread id:  " , threading.get_ident())
        if topic in self.topics:
            if client_id in self.topics[topic]['pub']:
                if self.topics[topic]['pub'][client_id]['seq'] == seq:
                    self.topics[topic]['pub'][client_id]['seq'] += 1
                    self.topics[topic]['msg'].append(message)
                    self.code = 200
                    self.reply = 'Message published to topic "' + topic + '".'
                else:
                    self.code = 500 # 500 (internal server error)
                    self.reply = "Number of sequence in server (" +  str(self.topics[topic]['pub'][client_id]['seq']) + ") different from client's (" + str(seq) + ")."
            else: # new publisher
                self.topics[topic]['pub'][client_id] = {'seq': seq}
                self.topics[topic]['pub'][client_id]['seq'] += 1
                self.topics[topic]['msg'].append(message)
                self.code = 200
                self.reply = 'Welcome new Publisher :)\nMessage published to topic "' + topic + '".'
        else:
            self.code = 404 # 404 (does not exist)
            self.reply = 'Topic "' + topic + '" does not exist.'


    def log(self, message):
        now = datetime.datetime.now()
        log = '[' + now.strftime("%m/%d/%Y, %H:%M:%S") + ']   ' + json.dumps(message) + "\n"

        # print(log) # to log to console
        print(json.dumps(message)) # to log to console

        f = open("../data/server/server_logs.txt", "a")
        f.write(log)
        f.close()


    def listen(self):
        """Listens for requests on the server's port
        """

        if DEBUG: print("-> Main thread id: " , threading.get_ident())

        while True:
            # Waits for the next request from client
            message = self.socket.recv_json()

            self.log(message)

            currTopic = list(message.keys())[0]

            match message[currTopic]['type']:
                case 'SUB':
                    t = threading.Thread(target=self.subscribe, args=(currTopic, message[currTopic]['id']))
                    t.start()
                    t.join()
                case 'UNSUB':
                    t = threading.Thread(target=self.unsubscribe, args=(currTopic, message[currTopic]['id']))
                    t.start()
                    t.join()
                case 'PUT':
                    t = threading.Thread(target=self.put, args=(message[currTopic]['msg'], currTopic, message[currTopic]['id'], message[currTopic]['seq']))
                    t.start()
                    t.join()
                case 'GET':
                    t = threading.Thread(target=self.get, args=(currTopic, message[currTopic]['id'], message[currTopic]['seq']))
                    t.start()
                    t.join()
                case _ :
                    self.code = "400"
                    self.reply = "Bad Requests"

            msg = {
                'code': self.code,
                'reply': self.reply
            }

            # if client crashes before server socket.send, server stop functioning well

            # Sends reply back to  the client
            self.socket.send_json(msg)

            if self.code == 200:
                write_to_json(self.path, self.topics)


def main(argv):

    if len(argv) != 1:
        print("Action not recognized.\nUsage: server.py <port>")
        return

    port =  argv[0]
    print("-> Started Server in port " + str(port))
    server = Server(port)

    server.listen()


# server.py port
if __name__ == '__main__':
    main(sys.argv[1:])
