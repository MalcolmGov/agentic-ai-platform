import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useAgent } from './useAgent'
import { AgentConfig } from './types'
import { useAgenticContext } from './AgenticProvider'

interface AgentChatProps {
  agentConfig: AgentConfig
  style?: object
  inputPlaceholder?: string
  showTimestamps?: boolean
}

export function AgentChat({ agentConfig, style, inputPlaceholder, showTimestamps = false }: AgentChatProps) {
  const { config } = useAgenticContext()
  const { messages, isLoading, error, sendMessage } = useAgent(agentConfig)
  const [input, setInput] = useState('')
  const listRef = useRef<FlatList>(null)
  const primaryColor = config.theme?.primaryColor ?? '#3b82f6'

  const handleSend = async () => {
    if (!input.trim()) return
    const text = input.trim()
    setInput('')
    await sendMessage(text)
    listRef.current?.scrollToEnd({ animated: true })
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#060a14' },
    messageList: { flex: 1, paddingHorizontal: 16 },
    userBubble: {
      alignSelf: 'flex-end',
      backgroundColor: primaryColor,
      borderRadius: 16,
      borderBottomRightRadius: 4,
      padding: 12,
      marginVertical: 4,
      maxWidth: '80%',
    },
    agentBubble: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: 16,
      borderBottomLeftRadius: 4,
      padding: 12,
      marginVertical: 4,
      maxWidth: '80%',
    },
    messageText: { color: '#fff', fontSize: 15, lineHeight: 22 },
    timestamp: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.08)',
      backgroundColor: 'rgba(13,19,36,0.95)',
    },
    input: {
      flex: 1,
      color: '#fff',
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      marginRight: 8,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendText: { color: '#fff', fontSize: 20 },
    errorText: { color: '#ef4444', textAlign: 'center', padding: 8, fontSize: 13 },
  })

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        ref={listRef}
        style={styles.messageList}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({ item }) => (
          <View style={item.role === 'user' ? styles.userBubble : styles.agentBubble}>
            <Text style={styles.messageText}>{item.content}</Text>
            {showTimestamps && (
              <Text style={styles.timestamp}>
                {item.timestamp.toLocaleTimeString()}
                {item.tokens ? ` · ${item.tokens} tokens` : ''}
              </Text>
            )}
          </View>
        )}
        ListFooterComponent={
          isLoading
            ? <ActivityIndicator color={primaryColor} style={{ margin: 16 }} />
            : null
        }
      />
      {error && <Text style={styles.errorText}>⚠️ {error}</Text>}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={inputPlaceholder ?? 'Ask me anything...'}
          placeholderTextColor="rgba(255,255,255,0.3)"
          multiline
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: primaryColor }]}
          onPress={handleSend}
          disabled={isLoading || !input.trim()}
        >
          <Text style={styles.sendText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
