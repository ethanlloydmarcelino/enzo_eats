import { Text, View } from 'react-native'
import { Check, X } from 'lucide-react-native'
import { orderSteps, orderProgress } from '../../orders/progress.mjs'
import { useThemeStore } from '../../store/useThemeStore'
import { useColors } from '../../theme'
export const OrderStepper = ({ order }) => {
  const colors = useColors(useThemeStore((state) => state.theme))
  const { stage, stopped } = orderProgress(order)
  return (
    <View
      accessibilityLabel={
        'Order progress: ' + (stopped ? order.status.toLowerCase() : orderSteps[stage])
      }
      style={{ marginVertical: 16, gap: 8 }}
    >
      <View style={{ flexDirection: 'row' }}>
        {orderSteps.map((label, step) => {
          const reached = step <= stage
          const color =
            stopped && step === stage ? '#b42318' : reached ? colors.primary : colors.border
          const done = step < stage || (step === 3 && stage === 3 && !stopped)
          return (
            <View key={label} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                <View
                  style={{ flex: 1, height: 2, backgroundColor: step ? color : 'transparent' }}
                />
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: color,
                    backgroundColor: reached ? color : colors.card,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {stopped && step === stage ? (
                    <X size={16} color="#fff" />
                  ) : done ? (
                    <Check size={16} color="#fff" />
                  ) : (
                    <Text style={{ color: reached ? '#fff' : colors.mutedForeground }}>
                      {step + 1}
                    </Text>
                  )}
                </View>
                <View
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor:
                      step === 3 ? 'transparent' : step < stage ? colors.primary : colors.border,
                  }}
                />
              </View>
              <Text
                style={{
                  fontSize: 11,
                  textAlign: 'center',
                  color: reached ? colors.foreground : colors.mutedForeground,
                  fontWeight: step === stage ? 'bold' : 'normal',
                }}
              >
                {label}
              </Text>
            </View>
          )
        })}
      </View>
      {stopped && (
        <Text style={{ color: '#b42318', fontWeight: 'bold' }}>
          {order.status === 'DENIED' ? 'Denied' : 'Cancelled'}
          {order.wasCompleted || order.completedAt ? ' after Done' : ''}
        </Text>
      )}
    </View>
  )
}
