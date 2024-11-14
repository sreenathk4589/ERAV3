import torch
import torch.nn as nn
import torch.nn.functional as F

def build_model(layers_config):
    layers = []
    for layer in layers_config:
        if layer['layer_type'] == 'conv2d':
            layers.append(
                nn.Conv2d(
                    in_channels=layer['in_channels'],
                    out_channels=layer['out_channels'],
                    kernel_size=layer['kernel_size'],
                    stride=layer['stride'],
                    padding=layer['padding']
                )
            )
        elif layer['layer_type'] == 'maxpool':
            layers.append(
                nn.MaxPool2d(
                    kernel_size=layer['kernel_size'],
                    stride=layer['stride']
                )
            )
        elif layer['layer_type'] == 'activation':
            if layer['function'] == 'relu':
                layers.append(nn.ReLU())
            elif layer['function'] == 'sigmoid':
                layers.append(nn.Sigmoid())
            elif layer['function'] == 'tanh':
                layers.append(nn.Tanh())
            elif layer['function'] == 'leaky_relu':
                layers.append(nn.LeakyReLU())
        elif layer['layer_type'] == 'linear':
            layers.append(nn.Linear(layer['in_features'], layer['out_features']))
            
    return nn.Sequential(*layers) 