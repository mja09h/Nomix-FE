import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const index = () => {
  return (
    <View>
      <Text>Nomix</Text>
    </View>
  )
}

export default index

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
    },
})