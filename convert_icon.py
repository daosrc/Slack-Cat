from PIL import Image
import os
from io import BytesIO
import subprocess

def convert_svg_to_png(svg_path, output_path, size):
    try:
        # 使用 rsvg-convert 命令行工具转换
        subprocess.run([
            'rsvg-convert',
            '-w', str(size),
            '-h', str(size),
            '-o', output_path,
            svg_path
        ], check=True)
        print(f"Successfully created {output_path}")
    except subprocess.CalledProcessError as e:
        print(f"Error converting {svg_path} to {output_path}: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

# 设置文件路径
svg_path = 'images/icon.svg'
sizes = [16, 48, 128]

# 为每个尺寸生成PNG
for size in sizes:
    output_path = f'images/icon{size}.png'
    convert_svg_to_png(svg_path, output_path, size)