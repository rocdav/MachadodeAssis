Atualização do Gradio no início
import subprocess
import sys

# Atualiza o Gradio uma única vez, silenciosamente
try:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--upgrade', 'gradio'],
                         stdout=subprocess.DEVNULL,
                         stderr=subprocess.DEVNULL)
except Exception as e:
    print(f"Aviso: {e}")

# Verifica a versão atual
try:
    import pkg_resources
    current_version = pkg_resources.get_distribution('gradio').version
    print(f"Versão do Gradio: {current_version}")
except:
    print("Não foi possível verificar a versão do Gradio")

import gradio as gr
