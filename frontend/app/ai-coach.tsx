import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { aiApi } from '../src/api/ai';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export default function AICoachScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hi! I\'m your AI Health Coach. Ask me anything about your nutrition, water intake, weight, or quitting smoking!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiApi.chat(userMsg);
      setMessages(prev => [...prev, { role: 'ai', content: response.response }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const getWeeklyReport = async () => {
    setLoading(true);
    try {
      const data = await aiApi.getWeeklyReport();
      setReport(data);
      setMessages(prev => [...prev, 
        { role: 'user', content: 'Generate my weekly health report' },
        { role: 'ai', content: data.report }
      ]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Failed to generate weekly report.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/dashboard')}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🤖 AI Health Coach</Text>
        <TouchableOpacity onPress={getWeeklyReport}>
          <Text style={styles.reportText}>📊</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollRef}
        style={styles.chatContainer}
        contentContainerStyle={{ paddingVertical: 16 }}
      >
        {messages.map((msg, idx) => (
          <View key={idx} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={msg.role === 'user' ? styles.userText : styles.aiText}>{msg.content}</Text>
          </View>
        ))}
        {loading && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <ActivityIndicator color="#667eea" />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything..."
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={loading}>
          <Text style={styles.sendText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  backText: { fontSize: 24, color: '#333' },
  reportText: { fontSize: 24 },
  chatContainer: { flex: 1, paddingHorizontal: 16 },
  messageBubble: { padding: 12, borderRadius: 16, marginVertical: 4, maxWidth: '80%' },
  userBubble: { backgroundColor: '#667eea', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  userText: { color: '#fff', fontSize: 14 },
  aiText: { color: '#333', fontSize: 14, lineHeight: 20 },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100, fontSize: 14 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#667eea', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendText: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
});
