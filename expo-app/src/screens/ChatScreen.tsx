import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useRadio } from '../context/RadioContext';
import { Send, Shield, MessageSquare } from 'lucide-react-native';

export function ChatScreen() {
  const { user } = useAuth();
  const { selectedChannel } = useRadio();
  const { messages, sendMessage } = useChat();
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText, selectedChannel?.id);
    setInputText('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>DESPACHO Y CHAT TÁCTICO</Text>
          <Text style={styles.headerSubtitle}>
            {selectedChannel ? selectedChannel.name : 'Frecuencia Operativa C5i'}
          </Text>
        </View>
        <Shield color="#10b981" size={18} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageSquare color="#94a3b8" size={44} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Canal de Mensajes Limpio</Text>
            <Text style={styles.emptySubtitle}>
              No hay mensajes ni reportes previos. Escribe el primer mensaje táctico usando la barra inferior.
            </Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => {
              const isMe = item.sender_id === user?.id;
              return (
                <View style={[styles.bubbleContainer, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                  <Text style={styles.senderName}>{item.sender_callsign || item.sender_name}</Text>
                  <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                    <Text style={styles.messageText}>{item.text}</Text>
                    <Text style={styles.timestamp}>
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Escribir mensaje operativo..."
            placeholderTextColor="#64748b"
            style={styles.input}
          />
          <Pressable onPress={handleSend} style={styles.sendButton}>
            <Send color="#ffffff" size={17} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070c16',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 14,
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  bubbleContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
  },
  bubbleRight: {
    alignSelf: 'flex-end',
  },
  senderName: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    marginHorizontal: 4,
  },
  bubble: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleThem: {
    backgroundColor: '#1e293b',
  },
  bubbleMe: {
    backgroundColor: '#691c32',
  },
  messageText: {
    color: '#f8fafc',
    fontSize: 14,
    lineHeight: 18,
  },
  timestamp: {
    color: '#94a3b8',
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#691c32',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
