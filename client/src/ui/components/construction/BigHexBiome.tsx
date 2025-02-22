import * as THREE from "three";
import { createHexagonShape } from "../worldmap/hexagon/HexagonGeometry";
import { FELT_CENTER, HEX_RADIUS } from "../worldmap/hexagon/WorldHexagon";
import { getUIPositionFromColRow } from "../../utils/utils";
import { biomes, getNeighborHexes } from "@bibliothecadao/eternum";
import { Hexagon } from "../../../types";
import { biomeComponents } from "../worldmap/hexagon/HexLayers";
import { useMemo } from "react";

const hexagonGeometry = new THREE.ExtrudeGeometry(createHexagonShape(HEX_RADIUS), { depth: 2, bevelEnabled: false });

const generateHexPositions = (biome: keyof typeof biomes) => {
  const _color = new THREE.Color("gray");
  const center = { col: 10, row: 10 };
  const RADIUS = 4;
  const positions: { x: number; y: number; z: number; color: THREE.Color; col: number; row: number }[] = [];
  const hexColRows: any[] = [];
  const borderHexes: any[] = [];
  const existingPositions = new Set<string>();

  const addPosition = (col: number, row: number, x: number, y: number, z: number, isBorder: boolean) => {
    const key = `${col},${row}`;
    if (!existingPositions.has(key)) {
      existingPositions.add(key);
      positions.push({ x, y, z, color: _color, col, row });
      if (isBorder) {
        borderHexes.push({ col: col + FELT_CENTER, row: row + FELT_CENTER });
      } else {
        hexColRows.push({ col: col + FELT_CENTER, row: row + FELT_CENTER });
      }
    }
  };

  for (let i = 0; i < RADIUS; i++) {
    if (i === 0) {
      const { x, y, z } = getUIPositionFromColRow(center.col, center.row, true);
      const adjustedZ = !["ocean", "deep_ocean"].includes(biome) ? 0.32 + z : 0.32;
      addPosition(center.col, center.row, x, y, adjustedZ, false);

      getNeighborHexes(center.col, center.row).forEach((neighbor) => {
        const { x, y, z } = getUIPositionFromColRow(neighbor.col, neighbor.row, true);
        const adjustedZ = !["ocean", "deep_ocean"].includes(biome) ? 0.32 + z : 0.32;
        addPosition(neighbor.col, neighbor.row, x, y, adjustedZ, false);
      });
    } else {
      positions.forEach((position) => {
        getNeighborHexes(position.col, position.row).forEach((neighbor) => {
          const { x, y, z } = getUIPositionFromColRow(neighbor.col, neighbor.row, true);
          const isBorderHex = i === RADIUS - 1;
          const adjustedZ = !isBorderHex && !["ocean", "deep_ocean"].includes(biome) ? 0.32 + z : 0.32;
          addPosition(neighbor.col, neighbor.row, x, y, adjustedZ, isBorderHex);
        });
      });
    }
  }

  return { positions, hexColRows, borderHexes };
};

const BigHexBiome = ({ biome }: { biome: keyof typeof biomes }) => {
  const { BiomeComponent, material } = useMemo(() => {
    return {
      BiomeComponent: biomeComponents[biome],
      material: new THREE.MeshMatcapMaterial({ color: new THREE.Color(biomes[biome]?.color) }),
    };
  }, [biome]);

  const { positions: hexPositions, hexColRows, borderHexes } = useMemo(() => generateHexPositions(biome), [biome]);

  const hexesInstancedMesh = useMemo(() => {
    const _tmp = new THREE.InstancedMesh(hexagonGeometry, material, hexPositions.length);
    const _tmpMatrix = new THREE.Matrix4();
    hexPositions.forEach((hexPosition, index) => {
      _tmpMatrix.setPosition(hexPosition.x, hexPosition.y, hexPosition.z);
      _tmp.setMatrixAt(index, _tmpMatrix);
    });
    return _tmp;
  }, [hexPositions, material]);

  return (
    <group rotation={[Math.PI / -2, 0, 0]} position={[0, 0, 0]}>
      <primitive object={hexesInstancedMesh} />
      <group position={[0, 0, 2.01]}>
        <BiomeComponent hexes={hexColRows} zOffsets={!["ocean", "deep_ocean"].includes(biome)} />
        <BiomeComponent hexes={borderHexes} zOffsets={false} />
      </group>
    </group>
  );
};

export default BigHexBiome;
