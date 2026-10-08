import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Rect, G, Circle } from 'react-native-svg';

interface QrCodeViewProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  title?: string;
}

export const QrCodeView: React.FC<QrCodeViewProps> = ({
  value,
  size = 180,
  color = '#0f172a',
  backgroundColor = '#ffffff',
  title,
}) => {
  // Genera una matriz QR estilizada de 23x23 con patrones de alineación auténticos
  const matrix = useMemo(() => {
    const N = 23;
    const grid: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

    // Función auxiliar para dibujar un buscador de posición (Finder Pattern 7x7)
    const drawFinder = (r: number, c: number) => {
      for (let i = -1; i <= 7; i++) {
        for (let j = -1; j <= 7; j++) {
          const row = r + i;
          const col = c + j;
          if (row >= 0 && row < N && col >= 0 && col < N) {
            if (i >= 0 && i <= 6 && j >= 0 && j <= 6) {
              const isBorder = i === 0 || i === 6 || j === 0 || j === 6;
              const isCenter = i >= 2 && i <= 4 && j >= 2 && j <= 4;
              grid[row][col] = isBorder || isCenter;
            } else {
              grid[row][col] = false;
            }
          }
        }
      }
    };

    // 3 esquinas de alineación QR
    drawFinder(0, 0);
    drawFinder(0, N - 7);
    drawFinder(N - 7, 0);

    // Patrón de sincronización (Timing patterns en fila 6 y columna 6)
    for (let i = 8; i < N - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Hash pseudoaleatorio determinista para el contenido de datos
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        // Ignorar áreas de los finders
        const inTopLeft = r <= 7 && c <= 7;
        const inTopRight = r <= 7 && c >= N - 8;
        const inBottomLeft = r >= N - 8 && c <= 7;
        const inTiming = (r === 6 && c >= 8 && c < N - 8) || (c === 6 && r >= 8 && r < N - 8);

        // Centro táctico C5i despejado
        const inCenterLogo = r >= 9 && r <= 13 && c >= 9 && c <= 13;

        if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming && !inCenterLogo) {
          const bit = ((hash ^ (r * 37 + c * 43 + r * c * 13)) & 1) === 0;
          grid[r][c] = bit;
        }
      }
    }

    return grid;
  }, [value]);

  const N = matrix.length;
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
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.3}
                height={cellSize + 0.3}
                fill={color}
              />
            );
          })
        )}

        {/* Emblema central C5i táctico */}
        <G>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={cellSize * 2.8}
            fill="#691c32"
            stroke="#ffffff"
            strokeWidth={1.5}
          />
        </G>
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
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
});
