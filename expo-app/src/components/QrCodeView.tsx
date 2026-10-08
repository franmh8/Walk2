import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { generateQrMatrix } from '../utils/qrGenerator';

interface QrCodeViewProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export const QrCodeView: React.FC<QrCodeViewProps> = ({
  value,
  size = 200,
  color = '#000000',
  backgroundColor = '#ffffff',
}) => {
  // Genera matriz estándar QR (ISO/IEC 18004)
  const matrix = useMemo(() => {
    try {
      return generateQrMatrix(value);
    } catch (e) {
      console.warn('Error generando QR estándar:', e);
      return [];
    }
  }, [value]);

  if (!matrix || matrix.length === 0) {
    return null;
  }

  // Zona de silencio estándar (quiet zone de 2 módulos de margen blanco para lectura óptica instantánea)
  const margin = 2;
  const N = matrix.length + margin * 2;
  const cellSize = size / N;

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Rect width={size} height={size} fill={backgroundColor} rx={12} />
        {matrix.map((row, r) =>
          row.map((active, c) => {
            if (!active) return null;
            return (
              <Rect
                key={`${r}-${c}`}
                x={(c + margin) * cellSize}
                y={(r + margin) * cellSize}
                width={cellSize + 0.15}
                height={cellSize + 0.15}
                fill={color}
              />
            );
          })
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});
