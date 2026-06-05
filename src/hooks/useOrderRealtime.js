import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { backendUrl } from '../App'

let socket = null
const getSocket = () => {
    if (!socket) socket = io(backendUrl, { transports: ['websocket', 'polling'] })
    return socket
}

export const useAdminOrderStream = (onUpdate) => {
    useEffect(() => {
        const s = getSocket()
        s.emit('subscribe:admin')
        s.on('order:update', onUpdate)
        return () => s.off('order:update', onUpdate)
    }, [onUpdate])
}

export const useOrderRealtime = (orderId) => {
    const [update, setUpdate] = useState(null)
    useEffect(() => {
        if (!orderId) return
        const s = getSocket()
        const handler = (payload) => {
            if (!payload?.orderId || payload.orderId === orderId) setUpdate(payload)
        }
        s.emit('subscribe:order', orderId)
        s.on('order:update', handler)
        return () => {
            s.emit('unsubscribe:order', orderId)
            s.off('order:update', handler)
        }
    }, [orderId])
    return update
}

export default useOrderRealtime
